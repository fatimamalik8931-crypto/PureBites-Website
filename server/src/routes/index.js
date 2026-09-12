// =========================================================
//  API router — mounts every feature router under /api.
//  Each phase adds one line here:
//    Phase 1  menuRouter        -> /api/menu
//    Phase 2  contactRouter     -> /api/contact        ✅ added
//    Phase 3  reservationRouter -> /api/reservations   ✅ added
//    Phase 4  orderRouter       -> /api/orders          ✅ added
//    Phase 5  adminRouter       -> /api/admin           ✅ added
//    Phase 6  dashboard API     -> /api/admin/*         ✅ added (inside adminRouter)
//    Phase 7  menu management   -> /api/admin/menu      ✅ added (inside adminRouter)
// =========================================================

import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { menuRouter } from './menu.routes.js';
import { contactRouter } from './contact.routes.js';
import { reservationRouter } from './reservation.routes.js';
import { orderRouter } from './order.routes.js';
import { adminRouter } from './admin.routes.js';
import { readLimiter, writeLimiter, adminLimiter } from '../middleware/rateLimit.js';

export const apiRouter = Router();

apiRouter.use('/health', readLimiter, healthRouter);
apiRouter.use('/menu', readLimiter, menuRouter);
apiRouter.use('/contact', writeLimiter, contactRouter);
apiRouter.use('/reservations', writeLimiter, reservationRouter);
apiRouter.use('/orders', writeLimiter, orderRouter);
apiRouter.use('/admin', adminLimiter, adminRouter);
