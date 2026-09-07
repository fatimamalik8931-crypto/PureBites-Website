// =========================================================
//  Rate limiters (express-rate-limit)
//  Different limits for different risk levels. Applied to routes
//  as they are added in later phases.
// =========================================================

import rateLimit from 'express-rate-limit';
import { ApiError } from '../lib/ApiError.js';

const handler = (req, res, next) => next(ApiError.tooMany('Too many requests — please slow down and try again shortly.'));

const common = {
  standardHeaders: true, // send RateLimit-* headers
  legacyHeaders: false,
  handler,
};

/** Generous limit for read-only public traffic (e.g. GET /api/menu). */
export const readLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
});

/** Tighter limit for public form submissions (contact / reservation / order). */
export const writeLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
});

/** Strict limit for the admin login route — slows brute-force attempts. */
export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 8,
});
