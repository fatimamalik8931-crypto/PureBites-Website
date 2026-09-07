// =========================================================
//  Menu service — all menu business logic lives here.
//  Routes stay thin; this is the reusable part.
// =========================================================

import { prisma } from '../lib/prisma.js';

/**
 * Shape a database row into the exact object the frontend expects.
 * The frontend's cart, filters and rendering all key off `id`, so we
 * expose the stable short `code` ("b1", "s3") as `id` — identical to
 * the old hardcoded MENU_ITEMS array.
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
  };
}

/**
 * The public menu: only items marked available, in the same order
 * they currently appear on the site (global sortOrder, set at seed time).
 */
export async function getPublicMenu() {
  const rows = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(toPublicShape);
}
