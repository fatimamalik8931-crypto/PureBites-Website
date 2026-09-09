// =========================================================
//  Database seed
//  Run with:  npm run db:seed        (from the server/ folder)
//  Also runs automatically after:  prisma migrate reset
//
//  Idempotent: uses upsert() keyed on `code`, so running it
//  repeatedly updates existing rows instead of duplicating them.
// =========================================================

import { PrismaClient } from '@prisma/client';
import { MENU_SEED } from './menu-seed-data.js';
import { hashPassword } from '../src/lib/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding menu items...');

  let created = 0;
  let updated = 0;

  for (let i = 0; i < MENU_SEED.length; i++) {
    const item = MENU_SEED[i];

    const existing = await prisma.menuItem.findUnique({ where: { code: item.code } });

    await prisma.menuItem.upsert({
      where: { code: item.code },
      create: {
        code: item.code,
        category: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        tag: item.tag ?? '',
        imageUrl: item.imageUrl,
        isAvailable: true,
        isFeatured: item.featured ?? false,
        sortOrder: i, // preserve the current on-screen order
      },
      update: {
        category: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        tag: item.tag ?? '',
        imageUrl: item.imageUrl,
        isFeatured: item.featured ?? false,
        sortOrder: i,
      },
    });

    if (existing) updated++;
    else created++;
  }

  const total = await prisma.menuItem.count();
  console.log(`Done. ${created} created, ${updated} updated. ${total} menu items in the database.`);

  await seedAdmin();
}

/**
 * Create the first admin account from .env (ADMIN_EMAIL / ADMIN_PASSWORD /
 * ADMIN_NAME). Safe to re-run:
 *   - account missing        → create it
 *   - account already exists → leave the password untouched, just refresh
 *                              the name and make sure it's active
 * To reset a forgotten password, delete the row (or use `prisma studio`)
 * and run the seed again.
 */
async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = (process.env.ADMIN_NAME || '').trim() || 'Pure Bites Admin';

  if (!email || !password) {
    console.log('Skipping admin seed — set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create one.');
    return;
  }
  if (password.length < 8) {
    console.warn('⚠  ADMIN_PASSWORD is shorter than 8 characters — use a stronger one before deploying.');
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    await prisma.adminUser.update({ where: { email }, data: { name, isActive: true } });
    console.log(`Admin already exists: ${email} (password left unchanged).`);
    return;
  }

  await prisma.adminUser.create({
    data: { email, name, passwordHash: await hashPassword(password) },
  });
  console.log(`Admin created: ${email}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
