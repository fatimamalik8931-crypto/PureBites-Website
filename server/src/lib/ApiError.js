// =========================================================
//  ApiError — a small custom error type.
//  Throwing `new ApiError(404, 'Menu item not found')` anywhere
//  in the app produces a clean JSON response with the right
//  HTTP status, handled centrally in middleware/errorHandler.js.
// =========================================================

export class ApiError extends Error {
  /**
   * @param {number} status  HTTP status code (e.g. 400, 404, 409, 500)
   * @param {string} message Safe, user-facing message
   * @param {object} [options]
   * @param {string} [options.code]    Machine-readable error code
   * @param {unknown} [options.details] Extra info (e.g. Zod field errors)
   */
  constructor(status, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options.code;
    this.details = options.details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, { code: 'BAD_REQUEST', details });
  }
  static unauthorized(msg = 'Authentication required') {
    return new ApiError(401, msg, { code: 'UNAUTHORIZED' });
  }
  static forbidden(msg = 'Not allowed') {
    return new ApiError(403, msg, { code: 'FORBIDDEN' });
  }
  static notFound(msg = 'Not found') {
    return new ApiError(404, msg, { code: 'NOT_FOUND' });
  }
  static conflict(msg = 'Conflict') {
    return new ApiError(409, msg, { code: 'CONFLICT' });
  }
  static tooMany(msg = 'Too many requests') {
    return new ApiError(429, msg, { code: 'RATE_LIMITED' });
  }
}
