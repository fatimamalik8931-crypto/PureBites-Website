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
        sortOrder: i, // preserve the current on-screen order
      },
      update: {
        category: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        tag: item.tag ?? '',
        imageUrl: item.imageUrl,
        sortOrder: i,
      },
    });

    if (existing) updated++;
    else created++;
  }

  const total = await prisma.menuItem.count();
  console.log(`Done. ${created} created, ${updated} updated. ${total} menu items in the database.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
