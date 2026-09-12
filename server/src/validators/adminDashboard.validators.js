// =========================================================
//  Admin dashboard request schemas (Zod)
//  Used by admin.dashboard.routes.js and admin.menu.routes.js.
// =========================================================

import { z } from 'zod';
import { MENU_CATEGORIES } from './menu.validators.js';

/** Order lifecycle. The allowed moves between them live in adminDashboard.service.js. */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

/** Booking lifecycle: pending → confirmed | cancelled, confirmed → cancelled. */
export const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled'];

// ---------------------------------------------------------
//  Shared pieces
// ---------------------------------------------------------

/** ?page=&pageSize=&q= — common to every list endpoint. */
const listFields = {
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z
    .string()
    .trim()
    .max(100, 'Search is too long.')
    .optional()
    .transform((v) => v || undefined),
};

/** Route param for any /:id — Prisma cuid()s are lowercase letters + digits. */
export const recordIdParamsSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{10,40}$/i, 'Invalid id.'),
});

// ---------------------------------------------------------
//  Orders / reservations / messages
// ---------------------------------------------------------

export const listOrdersQuerySchema = z
  .object({ ...listFields, status: z.enum(ORDER_STATUSES).optional() })
  .strip();

export const listReservationsQuerySchema = z
  .object({
    ...listFields,
    status: z.enum(RESERVATION_STATUSES).optional(),
    /** upcoming = reservedAt from now on (soonest first); past = before now (latest first). */
    when: z.enum(['upcoming', 'past', 'all']).default('all'),
  })
  .strip();

export const listMessagesQuerySchema = z
  .object({
    ...listFields,
    handled: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  })
  .strip();

export const orderStatusBodySchema = z.object({ status: z.enum(ORDER_STATUSES) }).strip();

export const reservationStatusBodySchema = z
  .object({ status: z.enum(RESERVATION_STATUSES) })
  .strip();

export const messageUpdateBodySchema = z
  .object({ isHandled: z.boolean({ required_error: 'isHandled is required.' }) })
  .strip();

// ---------------------------------------------------------
//  Account
// ---------------------------------------------------------

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(200),
    newPassword: z
      .string()
      .min(10, 'Use at least 10 characters.')
      .max(200, 'Password is too long.'),
  })
  .strip()
  .refine((b) => b.currentPassword !== b.newPassword, {
    message: 'The new password must be different from the current one.',
    path: ['newPassword'],
  });

// ---------------------------------------------------------
//  Menu management (Phase 7)
// ---------------------------------------------------------

/**
 * Images must come from somewhere the public site's Content-Security-Policy
 * allows, or they'd silently fail to load: our own /uploads folder, or Unsplash
 * (where the original 16 photos live).
 */
const UPLOADED_IMAGE = /^\/uploads\/[a-f0-9]{24}\.(jpg|png|webp)$/;
const UNSPLASH_IMAGE = /^https:\/\/images\.unsplash\.com\/[^\s"'<>]+$/;

export const menuCodeParamsSchema = z.object({
  code: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,19}$/, 'Invalid item code.'),
});

const menuFields = {
  category: z.enum(MENU_CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${MENU_CATEGORIES.join(', ')}` }),
  }),
  name: z.string().trim().min(2, 'Name is too short.').max(80, 'Name is too long.'),
  description: z
    .string()
    .trim()
    .min(5, 'Add a short description.')
    .max(300, 'Description is too long (300 characters max).'),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number.' })
    .int('Price must be whole rupees.')
    .min(1, 'Price must be at least Rs. 1.')
    .max(100000, 'That price looks wrong.'),
  tag: z.string().trim().max(30, 'Badge is too long (30 characters max).'),
  imageUrl: z
    .string()
    .trim()
    .max(500, 'Image link is too long.')
    .refine(
      (v) => UPLOADED_IMAGE.test(v) || UNSPLASH_IMAGE.test(v),
      'Upload an image, or paste an images.unsplash.com link.',
    ),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(100000),
};

export const createMenuItemBodySchema = z
  .object({
    code: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9][a-z0-9_-]{0,19}$/,
        'Code: up to 20 lowercase letters, digits, - or _ (e.g. "b7").',
      ),
    ...menuFields,
    tag: menuFields.tag.optional().default(''),
    isAvailable: menuFields.isAvailable.optional().default(true),
    isFeatured: menuFields.isFeatured.optional().default(false),
    sortOrder: menuFields.sortOrder.optional(),
  })
  .strip();

/** Every field optional; the code itself can't be changed (orders reference it). */
export const updateMenuItemBodySchema = z
  .object(menuFields)
  .partial()
  .strip()
  .refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update.' });
