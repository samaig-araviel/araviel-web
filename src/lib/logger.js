/**
 * Structured client-side logger.
 *
 * Responsibilities:
 * - Emit structured JSON to the browser console so diagnostics are inspectable
 *   locally and captured by browser telemetry.
 * - Forward `error` and `warn` events to the API so they survive in Vercel
 *   logs with a `requestId`. The endpoint is fire-and-forget and uses
 *   `navigator.sendBeacon` when available so unload events still deliver.
 * - Never show technical detail to the end user; callers surface a friendly
 *   message through the Toast system or an <ErrorFallback />.
 *
 * The logger is a plain module singleton so it can be imported from services,
 * hooks, and error boundaries without a React context dependency.
 */

const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

const ERROR_ENDPOINT = `${API_BASE}/api/client-errors`;
const IS_DEV = import.meta.env.DEV;
const MAX_STACK_LENGTH = 4000;

let sessionUserId = null;

/**
 * Update the current user id so subsequent logs carry it.
 * Pass `null` on sign-out.
 * @param {string | null} userId
 */
export function setLoggerUser(userId) {
  sessionUserId = userId || null;
}

/**
 * Generate a short, sortable request id used to correlate a client-side
 * error with server-side logs. Format: 12-char base36 timestamp + 6 random.
 * @returns {string}
 */
export function generateRequestId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}

function serializeError(err) {
  if (!err) return null;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack ? err.stack.slice(0, MAX_STACK_LENGTH) : undefined,
      code: err.code,
      status: err.status,
      requestId: err.requestId,
    };
  }
  if (typeof err === 'object') {
    try {
      return JSON.parse(JSON.stringify(err));
    } catch {
      return { message: String(err) };
    }
  }
  return { message: String(err) };
}

function baseRecord(level, message, context) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    userId: sessionUserId,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    ...context,
  };
}

function emitConsole(level, record) {
  const fn = console[level] || console.log;
  if (IS_DEV) {
    const { message, ...rest } = record;
    fn(`[${level}] ${message}`, rest);
  } else {
    fn(JSON.stringify(record));
  }
}

function forwardToServer(record) {
  if (typeof window === 'undefined') return;
  // Best-effort: never block the caller or throw.
  try {
    const payload = JSON.stringify(record);
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(ERROR_ENDPOINT, blob);
      return;
    }
    fetch(ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* swallow — logging must never fail loudly */
    });
  } catch {
    /* swallow */
  }
}

/**
 * Log a debug-level message. Only emitted in development.
 * @param {string} message
 * @param {object} [context]
 */
export function debug(message, context) {
  if (!IS_DEV) return;
  emitConsole('debug', baseRecord('debug', message, context));
}

/**
 * Log an info-level message.
 * @param {string} message
 * @param {object} [context]
 */
export function info(message, context) {
  emitConsole('info', baseRecord('info', message, context));
}

/**
 * Log a warning. Forwarded to the server so warnings are visible in Vercel logs.
 * @param {string} message
 * @param {object} [context]
 */
export function warn(message, context) {
  const record = baseRecord('warn', message, context);
  emitConsole('warn', record);
  forwardToServer(record);
}

/**
 * Log an error. Forwarded to the server so the full stack survives in Vercel logs.
 * @param {string} message - Human-readable summary for the log line.
 * @param {Error | unknown} [err] - The underlying error (never shown to users).
 * @param {object} [context] - Additional structured context.
 */
export function error(message, err, context) {
  const record = baseRecord('error', message, {
    ...context,
    error: serializeError(err),
  });
  emitConsole('error', record);
  forwardToServer(record);
}

export const logger = { debug, info, warn, error, setLoggerUser, generateRequestId };
