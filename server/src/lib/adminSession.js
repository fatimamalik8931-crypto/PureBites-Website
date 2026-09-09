// =========================================================
//  Admin session cookie.
//
//  After a successful login we set ONE cookie, `pb_admin`, holding
//  the admin's id. It is:
//    - signed      → tamper-proof (cookie-parser checks it against
//                    SESSION_SECRET; a forged value is rejected)
//    - httpOnly    → not readable by page JavaScript, so an XSS bug
//                    can't steal it
//    - sameSite    → not sent on cross-site requests (CSRF defence)
//    - secure      → HTTPS-only in production
//
//  This is a stateless session: everything needed is in the signed
//  cookie, so there is no server-side session store to manage. The
//  trade-off is that we can't force-log-out one cookie before it
//  expires — acceptable for a small admin panel. A future phase can
//  add a token version column if we ever need revocation.
// =========================================================

import { env } from '../config/env.js';

export const ADMIN_COOKIE = 'pb_admin';

/** Session lifetime: 7 days. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = () => ({
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  secure: env.isProd,
  path: '/',
  maxAge: MAX_AGE_MS,
});

/** Attach a fresh session cookie for `adminId` to the response. */
export function setAdminCookie(res, adminId) {
  res.cookie(ADMIN_COOKIE, adminId, cookieOptions());
}

/** Remove the session cookie (logout). Options must match those used to set it. */
export function clearAdminCookie(res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(ADMIN_COOKIE, opts);
}

/** The admin id from a valid signed cookie, or null. */
export function readAdminCookie(req) {
  const value = req.signedCookies?.[ADMIN_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
