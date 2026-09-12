// =========================================================
//  requireJsonBody — admin write requests must be JSON.
//
//  Defence in depth against CSRF: a malicious page can make a
//  browser submit an HTML <form> cross-site, but a form can only
//  send form-encoded / multipart / text bodies — never
//  application/json (that needs a CORS preflight we don't allow).
//  The SameSite cookie already blocks this; this is the second lock.
// =========================================================

import { ApiError } from '../lib/ApiError.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH']);

export function requireJsonBody(req, _res, next) {
  if (WRITE_METHODS.has(req.method) && !req.is('application/json')) {
    return next(new ApiError(415, 'Requests must be sent as JSON.', { code: 'UNSUPPORTED_MEDIA_TYPE' }));
  }
  next();
}
