/**
 * Thin `fetch` wrapper used by every service module.
 *
 * Responsibilities:
 * - Resolve the correct API base URL.
 * - Attach auth headers automatically unless the caller opts out.
 * - Generate a per-request id, send it as `X-Request-Id`, and propagate it
 *   onto any thrown error so it appears in both the toast (for copy/paste)
 *   and the structured server log.
 * - Normalize all failures into the typed `ServiceError` hierarchy so call
 *   sites can show friendly messages without parsing HTTP status codes.
 * - Log every failure through the structured logger.
 *
 * It does NOT attempt to retry. Retries belong in the caller where the
 * semantics of idempotency are known.
 */

import { getAuthHeaders } from '../services/authHeaders';
import { ServiceError, NetworkError, errorFromResponse } from './errors';
import { logger, generateRequestId } from './logger';

const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

const inflightSubscribers = new Set();
let inflightCount = 0;

function notifyInflight() {
  for (const fn of inflightSubscribers) fn(inflightCount);
}

/**
 * Subscribe to the global `apiFetch` in-flight counter. The callback is
 * invoked immediately with the current count and again on every change.
 * Returns an unsubscribe function.
 *
 * @param {(count: number) => void} callback
 * @returns {() => void}
 */
export function subscribeToInflight(callback) {
  inflightSubscribers.add(callback);
  callback(inflightCount);
  return () => inflightSubscribers.delete(callback);
}

/**
 * Resolve the full URL for an API path. Relative paths are mounted under the
 * configured API base; absolute URLs are used as-is so callers can point at
 * third-party endpoints (rare) without hacking around this helper.
 * @param {string} path
 */
function resolveUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function buildHeaders({ auth = true, headers: extra, body, json }) {
  const headers = new Headers(extra);
  if (auth) {
    const authHeaders = await getAuthHeaders();
    for (const [k, v] of Object.entries(authHeaders || {})) {
      if (!headers.has(k)) headers.set(k, v);
    }
  }
  if (json !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  } else if (body && !headers.has('Content-Type') && typeof body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

async function readErrorBody(response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return {
        technicalMessage: data?.error || data?.message || response.statusText,
        userMessage: data?.userMessage,
      };
    }
    const text = await response.text();
    return { technicalMessage: text || response.statusText };
  } catch {
    return { technicalMessage: response.statusText };
  }
}

/**
 * Perform an API request and return the parsed JSON body. Throws a
 * `ServiceError` subclass on any failure.
 *
 * @template T
 * @param {string} path - Path relative to the API base, or an absolute URL.
 * @param {object} [options]
 * @param {string} [options.method] - HTTP method. Defaults to GET.
 * @param {object} [options.json] - JSON body. When set, the body is stringified
 *   and `Content-Type: application/json` is added automatically.
 * @param {BodyInit} [options.body] - Raw body. Ignored when `json` is provided.
 * @param {Record<string, string>} [options.headers]
 * @param {boolean} [options.auth] - Include auth headers. Defaults to true.
 * @param {AbortSignal} [options.signal]
 * @param {boolean} [options.parse] - Parse response as JSON. Defaults to true.
 * @param {string} [options.errorContext] - Short label used in log lines.
 * @returns {Promise<T | Response>}
 */
export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    json,
    body,
    headers: extraHeaders,
    auth = true,
    signal,
    parse = true,
    errorContext,
  } = options;

  inflightCount += 1;
  notifyInflight();

  try {
    const requestId = generateRequestId();
    const url = resolveUrl(path);
    const headers = await buildHeaders({ auth, headers: extraHeaders, body, json });
    headers.set('X-Request-Id', requestId);

    const init = {
      method,
      headers,
      signal,
    };
    if (json !== undefined) {
      init.body = JSON.stringify(json);
    } else if (body !== undefined) {
      init.body = body;
    }

    let response;
    try {
      response = await fetch(url, init);
    } catch (cause) {
      if (cause?.name === 'AbortError') throw cause;
      const err = new NetworkError({ cause });
      err.requestId = requestId;
      logger.error('API request failed (network)', err, {
        route: errorContext || path,
        method,
        requestId,
      });
      throw err;
    }

    if (!response.ok) {
      const { technicalMessage, userMessage } = await readErrorBody(response);
      const serverRequestId = response.headers.get('x-request-id') || requestId;
      const err = errorFromResponse(response, technicalMessage, serverRequestId);
      if (userMessage) err.userMessage = userMessage;
      logger.error('API request failed', err, {
        route: errorContext || path,
        method,
        status: response.status,
        requestId: serverRequestId,
      });
      throw err;
    }

    if (!parse) return response;

    if (response.status === 204) return null;
    try {
      return await response.json();
    } catch (cause) {
      const err = new ServiceError({
        userMessage: 'We received an unexpected response. Please try again.',
        technicalMessage: cause instanceof Error ? cause.message : 'Invalid JSON response',
        status: response.status,
        requestId,
        cause,
      });
      logger.error('API response parse failed', err, {
        route: errorContext || path,
        method,
        requestId,
      });
      throw err;
    }
  } finally {
    inflightCount -= 1;
    notifyInflight();
  }
}

export { API_BASE };
