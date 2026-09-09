// =========================================================
//  Reservation request schema (Zod)
//  Used by reservation.routes.js via the validate() middleware.
// =========================================================

import { z } from 'zod';

/** Seating choices offered by the form's <select id="resSeat">. */
export const SEATING_OPTIONS = ['Indoor', 'Outdoor', 'Family cabin'];

/** 03XXXXXXXXX or +923XXXXXXXXX (spaces / dashes are stripped first). */
const PK_MOBILE = /^(\+92|0)3\d{9}$/;

/** Today's date (YYYY-MM-DD) in Asia/Karachi (UTC+5, no DST). */
function todayInKarachi() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Body for POST /api/reservations
 *
 *   name     3–100 chars
 *   phone    a valid PK mobile, punctuation stripped
 *   date     YYYY-MM-DD, today or later (Karachi)
 *   time     HH:MM
 *   guests   integer 1–20 (bigger groups call the restaurant)
 *   seating  one of SEATING_OPTIONS
 *   note     optional, ≤ 500 chars
 *   website  HONEYPOT — see contact.validators.js
 */
export const reservationBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Please enter your full name.')
      .max(100, 'Name is too long.'),
    phone: z
      .string()
      .trim()
      .min(1, 'Please enter your phone number.')
      .transform((s) => s.replace(/[\s-]/g, ''))
      .refine((s) => PK_MOBILE.test(s), 'Enter a valid Pakistani mobile number.'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date.'),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pick a valid time.'),
    guests: z.coerce
      .number({ invalid_type_error: 'Choose how many guests.' })
      .int('Guests must be a whole number.')
      .min(1, 'At least one guest.')
      .max(20, 'For groups over 20, please call us.'),
    seating: z.enum(SEATING_OPTIONS, {
      errorMap: () => ({ message: `Seating must be one of: ${SEATING_OPTIONS.join(', ')}` }),
    }),
    note: z
      .string()
      .trim()
      .max(500, 'Note is too long (500 characters max).')
      .optional()
      .default(''),
    website: z.string().max(200).optional().default(''),
  })
  .strip()
  .superRefine((val, ctx) => {
    const instant = new Date(`${val.date}T${val.time}:00+05:00`);
    if (Number.isNaN(instant.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'That date and time is not valid.' });
      return;
    }
    if (val.date < todayInKarachi()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'Please choose today or a future date.' });
    }
  });
