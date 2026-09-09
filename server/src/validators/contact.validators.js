// =========================================================
//  Contact form request schema (Zod)
//  Used by contact.routes.js via the validate() middleware.
// =========================================================

import { z } from 'zod';

/**
 * Body for POST /api/contact
 *
 *   name     2–100 chars
 *   email    a valid email, lower-cased and trimmed
 *   message  10–2000 chars
 *   website  HONEYPOT — a hidden field real users never see. Bots that
 *            auto-fill every input will set it; we accept the request but
 *            silently drop it (handled in the route). Kept optional so a
 *            normal submission without the field still validates.
 *
 * Unknown keys are stripped. Bad values → 400 with per-field messages.
 */
export const contactBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Please enter your name.')
      .max(100, 'Name is too long.'),
    email: z
      .string()
      .trim()
      .min(1, 'Please enter your email.')
      .email('Enter a valid email address.')
      .max(200, 'Email is too long.')
      .transform((s) => s.toLowerCase()),
    message: z
      .string()
      .trim()
      .min(10, 'Message should be at least 10 characters.')
      .max(2000, 'Message is too long (2000 characters max).'),
    website: z.string().max(200).optional().default(''),
  })
  .strip();
