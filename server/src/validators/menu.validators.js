// =========================================================
//  Menu request schemas (Zod)
//  Used by menu.routes.js via the validate() middleware.
// =========================================================

import { z } from 'zod';

/** The only categories the public menu recognises. */
export const MENU_CATEGORIES = ['burgers', 'sandwiches', 'sides', 'drinks'];

/**
 * Query string for GET /api/menu
 *   ?category=burgers   → one of MENU_CATEGORIES
 *   ?featured=true|false → boolean
 * Unknown keys are ignored. Bad values → 400 with a clear message.
 */
export const menuListQuerySchema = z
  .object({
    category: z
      .enum(MENU_CATEGORIES, {
        errorMap: () => ({ message: `Category must be one of: ${MENU_CATEGORIES.join(', ')}` }),
      })
      .optional(),
    featured: z
      .union([z.literal('true'), z.literal('false')], {
        errorMap: () => ({ message: 'featured must be "true" or "false"' }),
      })
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  })
  .strip();

/**
 * Route param for GET /api/menu/:id
 * The public id is the item's short `code` ("b1", "s3") — letters,
 * digits, dash and underscore only, kept short to reject junk early.
 */
export const menuItemParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Menu item id is required')
    .max(40, 'Menu item id is too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Menu item id contains invalid characters'),
});
