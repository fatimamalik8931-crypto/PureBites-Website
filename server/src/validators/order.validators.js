// =========================================================
//  Order request schema (Zod)
//  Used by order.routes.js via the validate() middleware.
//
//  The client sends ONLY item codes + quantities. Prices and
//  totals are recomputed server-side in order.service.js, so
//  there is deliberately nothing about money in this schema.
// =========================================================

import { z } from 'zod';

/** Payment choices offered by the form's radio group (name="pay"). */
export const PAYMENT_METHODS = ['cod', 'online'];

/** 03XXXXXXXXX or +923XXXXXXXXX (spaces / dashes are stripped first). */
const PK_MOBILE = /^(\+92|0)3\d{9}$/;

/** A single line the customer wants: a menu code and how many. */
const orderItemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Missing item code.')
    .max(20, 'Bad item code.'),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a number.' })
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.')
    .max(20, 'Max 20 of a single item — call us for bulk orders.'),
});

/**
 * Body for POST /api/orders
 *
 *   customerName  3–100 chars
 *   phone         a valid PK mobile, punctuation stripped
 *   address       10–300 chars (a real delivery address)
 *   note          optional, ≤ 500 chars
 *   payment       one of PAYMENT_METHODS
 *   items         1–50 lines of { code, quantity }
 *   website       HONEYPOT — see contact.validators.js
 *
 * Unknown keys are stripped. Bad values → 400 with per-field messages.
 */
export const orderBodySchema = z
  .object({
    customerName: z
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
    address: z
      .string()
      .trim()
      .min(10, 'Please enter a complete delivery address.')
      .max(300, 'Address is too long (300 characters max).'),
    note: z
      .string()
      .trim()
      .max(500, 'Note is too long (500 characters max).')
      .optional()
      .default(''),
    payment: z.enum(PAYMENT_METHODS, {
      errorMap: () => ({ message: `Payment must be one of: ${PAYMENT_METHODS.join(', ')}` }),
    }),
    items: z
      .array(orderItemSchema)
      .min(1, 'Add at least one item to your order.')
      .max(50, 'That is a lot of items — please call us for a large order.'),
    website: z.string().max(200).optional().default(''),
  })
  .strip();
