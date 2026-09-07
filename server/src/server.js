// =========================================================
//  Entry point — starts the HTTP server.
//  Run:  npm run dev   (auto-restart)   or   npm start
// =========================================================

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

async function start() {
  // Fail fast if the database is unreachable.
  try {
    await prisma.$connect();
    logger.info('Database connection OK');
  } catch (err) {
    logger.error({ err }, 'Could not connect to the database. Did you run migrations?');
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Pure Bites server running at http://localhost:${env.PORT}`);
    logger.info(`  Frontend:     http://localhost:${env.PORT}/`);
    logger.info(`  Health check: http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown so in-flight requests finish and the DB closes cleanly.
  const close = (signal) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => close('SIGINT'));
  process.on('SIGTERM', () => close('SIGTERM'));
}

start();
