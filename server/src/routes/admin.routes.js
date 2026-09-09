// =========================================================
//  Admin auth API
//
//  POST /api/admin/login
//    body: { email, password }
//    ok:   200 { ok: true, admin: { email, name } }   + sets pb_admin cookie
//    bad:  400 validation | 401 wrong credentials
//
//  POST /api/admin/logout
//    always 200 { ok: true }   + clears the cookie
//
//  GET  /api/admin/me
//    requireAdmin → 200 { admin: { id, email, name } } | 401
//
//  The login route carries the strict authLimiter (8 tries / 15 min / IP)
//  to slow brute-force guessing. The rest use the generous readLimiter
//  applied at the mount point in routes/index.js.
// =========================================================

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { loginBodySchema } from '../validators/admin.validators.js';
import { authenticateAdmin } from '../services/admin.service.js';
import { setAdminCookie, clearAdminCookie } from '../lib/adminSession.js';
import { ApiError } from '../lib/ApiError.js';
import { logger } from '../lib/logger.js';

export const adminRouter = Router();

adminRouter.post(
  '/login',
  authLimiter,
  validate({ body: loginBodySchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.valid.body;

    const admin = await authenticateAdmin(email, password);
    if (!admin) {
      logger.warn({ ip: req.ip, email }, 'Failed admin login');
      // One vague message on purpose — don't reveal which half was wrong.
      throw ApiError.unauthorized('Invalid email or password.');
    }

    setAdminCookie(res, admin.id);
    logger.info({ adminId: admin.id }, 'Admin signed in');
    res.json({ ok: true, admin: { email: admin.email, name: admin.name } });
  }),
);

adminRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    clearAdminCookie(res);
    res.json({ ok: true });
  }),
);

adminRouter.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ admin: req.admin });
  }),
);
