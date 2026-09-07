// =========================================================
//  404 handler for unknown /api/* routes.
//  Registered AFTER all real routes. Non-API paths fall through
//  to the static file server (the frontend), so we only 404 here
//  for requests that were clearly meant for the API.
// =========================================================

import { ApiError } from '../lib/ApiError.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
