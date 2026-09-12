// =========================================================
//  Small helpers shared by the admin list endpoints.
// =========================================================

import { prisma } from './prisma.js';
import { env } from '../config/env.js';

const isPostgres = /^postgres(ql)?:/i.test(env.DATABASE_URL);

/**
 * A case-insensitive "contains" filter that works on both databases.
 * SQLite's LIKE is already case-insensitive (for ASCII) and Prisma rejects
 * `mode` there; PostgreSQL needs `mode: 'insensitive'` explicitly.
 */
export function contains(value) {
  return isPostgres ? { contains: value, mode: 'insensitive' } : { contains: value };
}

/**
 * Run a count + a page of rows in one transaction.
 *
 * @returns {Promise<{ items: any[], page: number, pageSize: number, total: number, totalPages: number }>}
 */
export async function paginate(model, { where, orderBy, include, page, pageSize }) {
  const [total, items] = await prisma.$transaction([
    model.count({ where }),
    model.findMany({ where, orderBy, include, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Midnight today in Pakistan (UTC+5), as an absolute Date. */
export function startOfKarachiDay(now = new Date()) {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return new Date(`${ymd}T00:00:00+05:00`);
}
