// =========================================================
//  Admin auth request schemas (Zod)
//  Used by admin.routes.js via the validate() middleware.
// =========================================================

import { z } from 'zod';

/**
 * Body for POST /api/admin/login
 *
 *   email     required, trimmed + lower-cased
 *   password  required, 1–200 chars (we don't reveal the real policy here;
 *             the seed/creation path is where strength is enforced)
 *
 * On failure the route returns a single generic message, never "wrong
 * password" vs "no such user" — that would let someone probe for valid
 * accounts.
 */
export const loginBodySchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Enter your email.')
      .max(200, 'Email is too long.')
      .transform((s) => s.toLowerCase()),
    password: z
      .string()
      .min(1, 'Enter your password.')
      .max(200, 'Password is too long.'),
  })
  .strip();
