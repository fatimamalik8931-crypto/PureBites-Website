// =========================================================
//  GET /api/health
//  A tiny endpoint that confirms the server is running AND can
//  reach the database. Hosting platforms and uptime monitors
//  call this; it's also the easiest way for you to test Phase 0.
// =========================================================

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../lib/prisma.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    // `SELECT 1` — cheapest possible query to prove the DB connection works.
    await prisma.$queryRaw`SELECT 1`;

    // Also report how many menu items are loaded (proves the seed worked).
    const menuCount = await prisma.menuItem.count();

    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database: 'connected',
      menuItems: menuCount,
    });
  }),
);
