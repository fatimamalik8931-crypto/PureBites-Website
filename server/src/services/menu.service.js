// =========================================================
//  Menu service — all menu business logic lives here.
//  Routes stay thin; this is the reusable, testable part.
// =========================================================

import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/ApiError.js';

/**
 * Shape a database row into the exact object the frontend expects.
 * The frontend's cart, filters and rendering all key off `id`, so we
 * expose the stable short `code` ("b1", "s3") as `id` — identical to
 * the old hardcoded MENU_ITEMS array. `featured` is extra data the
 * public site ignores today but the admin dashboard will use.
 */
function toPublicShape(row) {
  return {
    id: row.code,
    cat: row.category,
    name: row.name,
    price: row.price,
    tag: row.tag || '',
    desc: row.description,
    img: row.imageUrl,
    featured: row.isFeatured,
  };
}

/**
 * The public menu: only items marked available, in the same order
 * they currently appear on the site (global sortOrder, set at seed time).
 *
 * @param {object} [filters]
 * @param {string}  [filters.category] one of the known categories
 * @param {boolean} [filters.featured] restrict to featured / non-featured
 * @returns {Promise<Array>} items in public shape
 */
export async function getPublicMenu(filters = {}) {
  const where = { isAvailable: true };
  if (filters.category) where.category = filters.category;
  if (typeof filters.featured === 'boolean') where.isFeatured = filters.featured;

  const rows = await prisma.menuItem.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(toPublicShape);
}

/**
 * A single available menu item, looked up by its public id (`code`).
 * Throws ApiError(404) if it doesn't exist or isn't currently available.
 *
 * @param {string} code e.g. "b1"
 * @returns {Promise<object>} item in public shape
 */
export async function getPublicMenuItem(code) {
  const row = await prisma.menuItem.findUnique({ where: { code } });

  if (!row || !row.isAvailable) {
    throw ApiError.notFound(`No available menu item with id "${code}".`);
  }
  return toPublicShape(row);
}
