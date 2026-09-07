// =========================================================
//  Central error handler — the LAST middleware registered.
//  Every thrown error / rejected promise ends up here, so the
//  client always gets a consistent JSON shape and we never leak
//  stack traces in production.
//
//  Response shape:
//    { "error": { "message": "...", "code": "...", "details": ... } }
// =========================================================

import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../lib/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
export function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Something went wrong. Please try again.';
  let code = 'INTERNAL';
  let details;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    code = err.code ?? code;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Some fields are invalid.';
    code = 'VALIDATION_ERROR';
    details = err.flatten().fieldErrors;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // e.g. P2002 = unique constraint violation
    if (err.code === 'P2002') {
      status = 409;
      message = 'That record already exists.';
      code = 'DUPLICATE';
    } else if (err.code === 'P2025') {
      status = 404;
      message = 'Record not found.';
      code = 'NOT_FOUND';
    } else {
      status = 400;
      message = 'Database request could not be completed.';
      code = 'DB_ERROR';
    }
  }

  // Log server-side. 5xx = error level, 4xx = warn.
  const logPayload = { err, status, path: req.originalUrl, method: req.method };
  if (status >= 500) logger.error(logPayload, 'Request failed');
  else logger.warn(logPayload, 'Request rejected');

  const body = { error: { message, code } };
  if (details) body.error.details = details;
  // Only expose the raw error/stack in development.
  if (env.isDev && status >= 500) body.error.raw = String(err?.stack || err);

  res.status(status).json(body);
}
