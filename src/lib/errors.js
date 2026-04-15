/**
 * Typed error hierarchy for the frontend.
 *
 * Every service call resolves to either a value or a `ServiceError`. The
 * error carries:
 * - `userMessage`: a plain-language string safe to show in a toast or page.
 * - `technicalMessage`: the raw server message, used only for logging.
 * - `status` / `code` / `requestId`: machine-readable fields used by callers
 *   that need to react to specific failure modes (for example session expiry).
 *
 * Call sites should surface `userMessage` through `useToast().showError(...)`
 * or an `<ErrorFallback />` and forward the full error object to `logger.error`.
 */

/**
 * Generic error for any recoverable failure surfaced from a service.
 */
export class ServiceError extends Error {
  /**
   * @param {object} opts
   * @param {string} opts.userMessage - Plain-language message safe to display.
   * @param {string} [opts.technicalMessage] - Full server message for logs.
   * @param {number} [opts.status] - HTTP status if applicable.
   * @param {string} [opts.code] - Machine-readable code (e.g. AUTH_EXPIRED).
   * @param {string} [opts.requestId] - Request id for correlation with server logs.
   * @param {unknown} [opts.cause] - Original error for debugging.
   */
  constructor({ userMessage, technicalMessage, status, code, requestId, cause } = {}) {
    super(technicalMessage || userMessage || 'Service error');
    this.name = 'ServiceError';
    this.userMessage = userMessage || 'Something went wrong. Please try again.';
    this.technicalMessage = technicalMessage;
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * The browser could not reach the server (offline, DNS, CORS, etc.).
 */
export class NetworkError extends ServiceError {
  constructor({ cause } = {}) {
    super({
      userMessage: "We couldn't reach Araviel. Please check your connection and try again.",
      technicalMessage: cause instanceof Error ? cause.message : 'Network request failed',
      code: 'NETWORK_ERROR',
      cause,
    });
    this.name = 'NetworkError';
  }
}

/**
 * The user's session has expired or is invalid. Callers typically route the
 * user back to sign-in.
 */
export class AuthExpiredError extends ServiceError {
  constructor({ requestId, cause } = {}) {
    super({
      userMessage: 'Your session has expired. Please sign in again to continue.',
      technicalMessage: 'Authentication required',
      status: 401,
      code: 'AUTH_EXPIRED',
      requestId,
      cause,
    });
    this.name = 'AuthExpiredError';
  }
}

/**
 * A validation error returned by the server. The user-facing message is the
 * server's message so the UI can relay precise guidance (e.g. "Title too long").
 */
export class ValidationError extends ServiceError {
  constructor({ userMessage, technicalMessage, status = 400, requestId, cause } = {}) {
    super({
      userMessage: userMessage || 'That request could not be processed. Please try again.',
      technicalMessage,
      status,
      code: 'VALIDATION_ERROR',
      requestId,
      cause,
    });
    this.name = 'ValidationError';
  }
}

/**
 * The current plan does not include the requested feature or has no credits left.
 */
export class QuotaExceededError extends ServiceError {
  constructor({ userMessage, technicalMessage, requestId, cause } = {}) {
    super({
      userMessage:
        userMessage || "You've reached your current plan's limit. Upgrade your plan to keep going.",
      technicalMessage,
      status: 402,
      code: 'QUOTA_EXCEEDED',
      requestId,
      cause,
    });
    this.name = 'QuotaExceededError';
  }
}

/**
 * Map a non-OK Response to the appropriate error class. Used by `apiFetch`.
 * @param {Response} response
 * @param {string} technicalMessage
 * @param {string} [requestId]
 */
export function errorFromResponse(response, technicalMessage, requestId) {
  const { status } = response;
  if (status === 401) return new AuthExpiredError({ requestId });
  if (status === 402) {
    return new QuotaExceededError({ technicalMessage, requestId });
  }
  if (status >= 400 && status < 500) {
    return new ValidationError({
      userMessage: userMessageForStatus(status),
      technicalMessage,
      status,
      requestId,
    });
  }
  return new ServiceError({
    userMessage: "Something went wrong on our end. We're looking into it — please try again.",
    technicalMessage,
    status,
    requestId,
  });
}

function userMessageForStatus(status) {
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 409)
    return 'That change conflicts with a recent update. Please refresh and try again.';
  if (status === 413) return 'That file is too large. Please try a smaller one.';
  if (status === 429)
    return "You're doing that a bit too often. Please wait a moment and try again.";
  return 'That request could not be processed. Please try again.';
}
