// =========================================================
//  Admin dashboard API (Phase 6) — all routes require a signed-in
//  admin (requireAdmin is applied where this router is mounted,
//  in admin.routes.js).
//
//  GET    /api/admin/meta                      status + category lists for the UI
//  GET    /api/admin/stats                     overview numbers
//
//  GET    /api/admin/orders                    ?status=&q=&page=&pageSize=
//  GET    /api/admin/orders/:id
//  PATCH  /api/admin/orders/:id/status         { status }
//
//  GET    /api/admin/reservations              ?status=&when=upcoming|past|all&q=&page=&pageSize=
//  PATCH  /api/admin/reservations/:id/status   { status }
//
//  GET    /api/admin/messages                  ?handled=true|false&q=&page=&pageSize=
//  PATCH  /api/admin/messages/:id              { isHandled }
//  DELETE /api/admin/messages/:id
//
//  PATCH  /api/admin/password                  { currentPassword, newPassword }
//
//  List responses: { items, page, pageSize, total, totalPages }
//  Orders and reservations carry `nextStatuses` — the moves allowed now.
//  Illegal move → 409 INVALID_TRANSITION.
// =========================================================

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { MENU_CATEGORIES } from '../validators/menu.validators.js';
import {
  ORDER_STATUSES,
  RESERVATION_STATUSES,
  recordIdParamsSchema,
  listOrdersQuerySchema,
  listReservationsQuerySchema,
  listMessagesQuerySchema,
  orderStatusBodySchema,
  reservationStatusBodySchema,
  messageUpdateBodySchema,
  changePasswordBodySchema,
} from '../validators/adminDashboard.validators.js';
import * as dashboard from '../services/adminDashboard.service.js';

export const adminDashboardRouter = Router();

adminDashboardRouter.get('/meta', (req, res) => {
  res.json({
    orderStatuses: ORDER_STATUSES,
    reservationStatuses: RESERVATION_STATUSES,
    menuCategories: MENU_CATEGORIES,
  });
});

adminDashboardRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    res.json({ stats: await dashboard.getStats() });
  }),
);

// ---- Orders ----

adminDashboardRouter.get(
  '/orders',
  validate({ query: listOrdersQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await dashboard.listOrders(req.valid.query));
  }),
);

adminDashboardRouter.get(
  '/orders/:id',
  validate({ params: recordIdParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json({ order: await dashboard.getOrder(req.valid.params.id) });
  }),
);

adminDashboardRouter.patch(
  '/orders/:id/status',
  validate({ params: recordIdParamsSchema, body: orderStatusBodySchema }),
  asyncHandler(async (req, res) => {
    const order = await dashboard.setOrderStatus(req.valid.params.id, req.valid.body.status, req.admin);
    res.json({ order });
  }),
);

// ---- Reservations ----

adminDashboardRouter.get(
  '/reservations',
  validate({ query: listReservationsQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await dashboard.listReservations(req.valid.query));
  }),
);

adminDashboardRouter.patch(
  '/reservations/:id/status',
  validate({ params: recordIdParamsSchema, body: reservationStatusBodySchema }),
  asyncHandler(async (req, res) => {
    const reservation = await dashboard.setReservationStatus(
      req.valid.params.id,
      req.valid.body.status,
      req.admin,
    );
    res.json({ reservation });
  }),
);

// ---- Contact messages ----

adminDashboardRouter.get(
  '/messages',
  validate({ query: listMessagesQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await dashboard.listMessages(req.valid.query));
  }),
);

adminDashboardRouter.patch(
  '/messages/:id',
  validate({ params: recordIdParamsSchema, body: messageUpdateBodySchema }),
  asyncHandler(async (req, res) => {
    const message = await dashboard.setMessageHandled(req.valid.params.id, req.valid.body.isHandled);
    res.json({ message });
  }),
);

adminDashboardRouter.delete(
  '/messages/:id',
  validate({ params: recordIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await dashboard.deleteMessage(req.valid.params.id, req.admin);
    res.json({ ok: true });
  }),
);

// ---- Account ----

adminDashboardRouter.patch(
  '/password',
  validate({ body: changePasswordBodySchema }),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.valid.body;
    await dashboard.changePassword(req.admin.id, currentPassword, newPassword);
    res.json({ ok: true });
  }),
);
