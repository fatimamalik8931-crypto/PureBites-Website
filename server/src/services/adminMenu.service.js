// =========================================================
//  Admin menu service (Phase 7) — create / edit / delete items.
//
//  Deleting is safe for order history: OrderItem rows store the
//  item's code, name and price as a snapshot, not a foreign key.
//  To take an item off the site temporarily, set isAvailable=false
//  instead — the public API already hides unavailable items.
// =========================================================

import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/ApiError.js';
import { logger } from '../lib/logger.js';
import { removeUploadIfUnused } from '../lib/uploads.js';

/** Full editable view of a row (the public API uses its own, smaller shape). */
function toAdminShape(row) {
  return {
    code: row.code,
    category: row.category,
    name: row.name,
    description: row.description,
    price: row.price,
    tag: row.tag,
    imageUrl: row.imageUrl,
    isAvailable: row.isAvailable,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findOr404(code) {
  const row = await prisma.menuItem.findUnique({ where: { code } });
  if (!row) throw ApiError.notFound(`No menu item with code "${code}".`);
  return row;
}

/** Every item, hidden ones included, in on-site order. */
export async function listMenuItems() {
  const rows = await prisma.menuItem.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  return rows.map(toAdminShape);
}

export async function createMenuItem(input, admin) {
  const existing = await prisma.menuItem.findUnique({ where: { code: input.code } });
  if (existing) {
    throw new ApiError(409, 'Some fields are invalid.', {
      code: 'VALIDATION_ERROR',
      details: { code: [`Code "${input.code}" is already used by "${existing.name}".`] },
    });
  }

  let { sortOrder } = input;
  if (sortOrder === undefined) {
    // New items go to the end of the menu by default.
    const { _max } = await prisma.menuItem.aggregate({ _max: { sortOrder: true } });
    sortOrder = (_max.sortOrder ?? -1) + 1;
  }

  const row = await prisma.menuItem.create({ data: { ...input, sortOrder } });
  logger.info({ code: row.code, adminId: admin.id }, 'Menu item created');
  return toAdminShape(row);
}

export async function updateMenuItem(code, changes, admin) {
  const before = await findOr404(code);
  const row = await prisma.menuItem.update({ where: { code }, data: changes });

  if (changes.imageUrl && changes.imageUrl !== before.imageUrl) {
    await removeUploadIfUnused(before.imageUrl);
  }
  logger.info({ code, fields: Object.keys(changes), adminId: admin.id }, 'Menu item updated');
  return toAdminShape(row);
}

export async function deleteMenuItem(code, admin) {
  const before = await findOr404(code);
  await prisma.menuItem.delete({ where: { code } });
  await removeUploadIfUnused(before.imageUrl);
  logger.info({ code, adminId: admin.id }, 'Menu item deleted');
}
