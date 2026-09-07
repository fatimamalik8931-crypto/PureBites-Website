// =========================================================
//  Prisma client — one shared instance for the whole app.
//  Creating multiple clients exhausts database connections,
//  so every file imports THIS instance.
// =========================================================

import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

export const prisma = new PrismaClient({
  log: env.isDev ? ['warn', 'error'] : ['error'],
});

// Close the connection cleanly when the process is shutting down.
async function shutdown() {
  await prisma.$disconnect();
}
process.on('beforeExit', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
