// =========================================================
//  requireAdmin — gate for every admin-only route.
//
//  Reads the signed session cookie, loads the matching AdminUser,
//  and attaches it as `req.admin`. Anything missing / invalid /
//  disabled → 401 and the handler never runs.
//
//  Usage:
//    router.get('/orders', requireAdmin, asyncHandler(handler));
// =========================================================

import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/ApiError.js';
import { readAdminCookie, clearAdminCookie } from '../lib/adminSession.js';
import { asyncHandler } from './asyncHandler.js';

export const requireAdmin = asyncHandler(async (req, res, next) => {
  const adminId = readAdminCookie(req);
  if (!adminId) {
    throw ApiError.unauthorized('Please sign in.');
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, name: true, isActive: true },
  });

  // Cookie is validly signed but the account is gone or switched off —
  // clear the stale cookie so the browser stops sending it.
  if (!admin || !admin.isActive) {
    clearAdminCookie(res);
    throw ApiError.unauthorized('Your session is no longer valid. Please sign in again.');
  }

  req.admin = { id: admin.id, email: admin.email, name: admin.name };
  next();
});
