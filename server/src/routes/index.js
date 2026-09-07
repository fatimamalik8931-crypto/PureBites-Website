// =========================================================
//  API router — mounts every feature router under /api.
//  Each phase adds one line here:
//    Phase 1  menuRouter      -> /api/menu
//    Phase 2  contactRouter   -> /api/contact
//    Phase 3  reserveRouter   -> /api/reservations
//    Phase 4  orderRouter     -> /api/orders
//    Phase 5  adminRouter     -> /api/admin
// =========================================================

import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { readLimiter } from '../middleware/rateLimit.js';

export const apiRouter = Router();

apiRouter.use('/health', readLimiter, healthRouter);
