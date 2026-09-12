// =========================================================
//  Admin dashboard service (Phase 6)
//  Read + triage everything the public forms collect:
//  orders, reservations and contact messages.
// =========================================================

import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/ApiError.js';
import { logger } from '../lib/logger.js';
import { contains, paginate, startOfKarachiDay } from '../lib/listing.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

// ---------------------------------------------------------
//  Status flows — the only moves staff can make.
//  Finished states (delivered / cancelled) are final so the
//  history can't be quietly rewritten.
// ---------------------------------------------------------

const ORDER_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const RESERVATION_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: [],
};

/** Adds `nextStatuses` so the dashboard can draw the right buttons without duplicating the rules. */
const withOrderMoves = (order) => ({ ...order, nextStatuses: ORDER_FLOW[order.status] ?? [] });
const withReservationMoves = (r) => ({ ...r, nextStatuses: RESERVATION_FLOW[r.status] ?? [] });

/**
 * Move a record from its current status to `next`, if the flow allows it.
 * The update is conditional on the status we just read (`updateMany where
 * status = current`), so two staff clicking at once can't both win.
 */
async function transition(model, flow, id, next, label) {
  const current = await model.findUnique({ where: { id }, select: { status: true } });
  if (!current) throw ApiError.notFound(`${label} not found.`);
  if (current.status === next) return; // nothing to do

  if (!(flow[current.status] ?? []).includes(next)) {
    throw new ApiError(409, `Can't change a ${current.status} ${label.toLowerCase()} to ${next}.`, {
      code: 'INVALID_TRANSITION',
      details: { status: current.status, allowed: flow[current.status] ?? [] },
    });
  }

  const { count } = await model.updateMany({
    where: { id, status: current.status },
    data: { status: next },
  });
  if (count === 0) {
    throw new ApiError(409, `This ${label.toLowerCase()} was just updated by someone else. Refresh and try again.`, {
      code: 'STALE',
    });
  }
}

// ---------------------------------------------------------
//  Overview
// ---------------------------------------------------------

export async function getStats() {
  const now = new Date();
  const today = startOfKarachiDay(now);

  const [ordersToday, pendingOrders, activeOrders, pendingReservations, upcomingReservations, unhandledMessages, menuTotal, menuHidden] =
    await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: today }, status: { not: 'cancelled' } },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: { in: ['confirmed', 'preparing', 'out_for_delivery'] } } }),
      prisma.reservation.count({ where: { status: 'pending' } }),
      prisma.reservation.count({ where: { reservedAt: { gte: now }, status: { not: 'cancelled' } } }),
      prisma.contactMessage.count({ where: { isHandled: false } }),
      prisma.menuItem.count(),
      prisma.menuItem.count({ where: { isAvailable: false } }),
    ]);

  return {
    orders: {
      today: ordersToday._count._all,
      revenueToday: ordersToday._sum.total ?? 0,
      pending: pendingOrders,
      inProgress: activeOrders,
    },
    reservations: { pending: pendingReservations, upcoming: upcomingReservations },
    messages: { unhandled: unhandledMessages },
    menu: { total: menuTotal, hidden: menuHidden },
  };
}

// ---------------------------------------------------------
//  Orders
// ---------------------------------------------------------

export async function listOrders({ status, q, page, pageSize }) {
  const where = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { reference: contains(q.toUpperCase()) },
      { customerName: contains(q) },
      { phone: contains(q.replace(/[\s-]/g, '')) },
    ];
  }

  const result = await paginate(prisma.order, {
    where,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
    page,
    pageSize,
  });
  return { ...result, items: result.items.map(withOrderMoves) };
}

export async function getOrder(id) {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw ApiError.notFound('Order not found.');
  return withOrderMoves(order);
}

export async function setOrderStatus(id, status, admin) {
  await transition(prisma.order, ORDER_FLOW, id, status, 'Order');
  logger.info({ orderId: id, status, adminId: admin.id }, 'Order status changed');
  return getOrder(id);
}

// ---------------------------------------------------------
//  Reservations
// ---------------------------------------------------------

export async function listReservations({ status, when, q, page, pageSize }) {
  const now = new Date();
  const where = {};
  if (status) where.status = status;
  if (when === 'upcoming') where.reservedAt = { gte: now };
  if (when === 'past') where.reservedAt = { lt: now };
  if (q) {
    where.OR = [{ name: contains(q) }, { phone: contains(q.replace(/[\s-]/g, '')) }];
  }

  const result = await paginate(prisma.reservation, {
    where,
    // Upcoming: soonest first. Otherwise: most recent booking time first.
    orderBy: { reservedAt: when === 'upcoming' ? 'asc' : 'desc' },
    page,
    pageSize,
  });
  return { ...result, items: result.items.map(withReservationMoves) };
}

export async function setReservationStatus(id, status, admin) {
  await transition(prisma.reservation, RESERVATION_FLOW, id, status, 'Reservation');
  logger.info({ reservationId: id, status, adminId: admin.id }, 'Reservation status changed');
  return withReservationMoves(await prisma.reservation.findUnique({ where: { id } }));
}

// ---------------------------------------------------------
//  Contact messages
// ---------------------------------------------------------

export async function listMessages({ handled, q, page, pageSize }) {
  const where = {};
  if (typeof handled === 'boolean') where.isHandled = handled;
  if (q) {
    where.OR = [{ name: contains(q) }, { email: contains(q.toLowerCase()) }, { message: contains(q) }];
  }
  return paginate(prisma.contactMessage, { where, orderBy: { createdAt: 'desc' }, page, pageSize });
}

export function setMessageHandled(id, isHandled) {
  // P2025 (no such row) → 404 via the central error handler.
  return prisma.contactMessage.update({ where: { id }, data: { isHandled } });
}

export async function deleteMessage(id, admin) {
  await prisma.contactMessage.delete({ where: { id } });
  logger.info({ messageId: id, adminId: admin.id }, 'Contact message deleted');
}

// ---------------------------------------------------------
//  Account
// ---------------------------------------------------------

export async function changePassword(adminId, currentPassword, newPassword) {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  const ok = await verifyPassword(currentPassword, admin?.passwordHash);
  if (!ok) {
    throw new ApiError(400, 'Some fields are invalid.', {
      code: 'VALIDATION_ERROR',
      details: { currentPassword: ['Current password is incorrect.'] },
    });
  }

  await prisma.adminUser.update({
    where: { id: adminId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  logger.info({ adminId }, 'Admin password changed');
}
