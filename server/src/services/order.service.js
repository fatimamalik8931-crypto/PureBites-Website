// =========================================================
//  Order service — business logic for the delivery order form.
//
//  Golden rule: the server owns every price. The client tells us
//  WHICH items and HOW MANY; we look up the current price of each
//  from the MenuItem table and add it all up here. A tampered or
//  stale client total can never reach the database.
//
//  Same store-first / notify-best-effort shape as the other forms.
// =========================================================

import { randomBytes } from 'node:crypto';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { ApiError } from '../lib/ApiError.js';
import { sendNotificationEmail } from '../lib/mailer.js';

/** Delivery is free today. Kept as one knob so it is easy to change later. */
const DELIVERY_FEE = 0;

/** e.g. "PB-3F9K2" — short, unambiguous (no 0/O/1/I), easy to read on the phone. */
function makeReference() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = randomBytes(5);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `PB-${out}`;
}

/**
 * Collapse duplicate codes (client might send the same item twice) into a
 * single { code -> quantity } map, capped defensively at 20 per item.
 */
function mergeQuantities(items) {
  const map = new Map();
  for (const { code, quantity } of items) {
    map.set(code, Math.min((map.get(code) ?? 0) + quantity, 20));
  }
  return map;
}

/**
 * Create an order: validate the basket against the live menu, price it
 * server-side, store Order + OrderItems in one transaction, then (best
 * effort) email the restaurant.
 *
 * @param {{ customerName, phone, address, note?, payment, items: Array<{code,quantity}> }} input  already validated
 * @param {{ ip?: string, userAgent?: string }} [meta]
 * @returns {Promise<import('@prisma/client').Order & { items: import('@prisma/client').OrderItem[] }>}
 */
export async function createOrder(input, meta = {}) {
  const wanted = mergeQuantities(input.items);
  const codes = [...wanted.keys()];

  // Look up only items that are actually orderable right now.
  const menuRows = await prisma.menuItem.findMany({
    where: { code: { in: codes }, isAvailable: true },
  });
  const byCode = new Map(menuRows.map((row) => [row.code, row]));

  // Anything the customer asked for that we can't sell → reject with a clear,
  // per-item message the frontend can show (design mirrors validation errors).
  const missing = codes.filter((code) => !byCode.has(code));
  if (missing.length > 0) {
    throw new ApiError(409, 'Some items in your order are no longer available.', {
      code: 'ITEM_UNAVAILABLE',
      details: { items: missing.map((code) => `"${code}" is not available right now.`) },
    });
  }

  // Build the priced lines from the DB — never from anything the client sent.
  const lines = codes.map((code) => {
    const row = byCode.get(code);
    const quantity = wanted.get(code);
    return {
      menuItemCode: row.code,
      name: row.name,
      unitPrice: row.price,
      quantity,
      lineTotal: row.price * quantity,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const deliveryFee = DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  // Retry a couple of times on the (astronomically unlikely) reference clash.
  let record;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      record = await prisma.order.create({
        data: {
          reference: makeReference(),
          customerName: input.customerName,
          phone: input.phone,
          address: input.address,
          note: input.note ?? '',
          paymentMethod: input.payment,
          subtotal,
          deliveryFee,
          total,
          ipAddress: meta.ip ?? null,
          userAgent: meta.userAgent ?? null,
          items: { create: lines },
        },
        include: { items: true },
      });
      break;
    } catch (err) {
      const isRefClash = err?.code === 'P2002' && attempt < 2;
      if (!isRefClash) throw err;
    }
  }

  const mail = await sendNotificationEmail({
    subject: `New order ${record.reference} — ${record.customerName}, Rs. ${record.total}`,
    text: [
      `Reference: ${record.reference}`,
      `Name:      ${record.customerName}`,
      `Phone:     ${record.phone}`,
      `Address:   ${record.address}`,
      `Payment:   ${record.paymentMethod === 'online' ? 'Pay online (requested)' : 'Cash on delivery'}`,
      record.note ? `Note:      ${record.note}` : null,
      '',
      'Items:',
      ...record.items.map(
        (l) => `  ${l.quantity} x ${l.name} @ Rs. ${l.unitPrice} = Rs. ${l.lineTotal}`,
      ),
      '',
      `Subtotal:  Rs. ${record.subtotal}`,
      `Delivery:  Rs. ${record.deliveryFee}`,
      `Total:     Rs. ${record.total}`,
      '',
      `Received ${record.createdAt.toISOString()}`,
    ]
      .filter((line) => line !== null)
      .join('\n'),
  });

  if (!mail.sent) {
    logger.warn(
      { orderId: record.id, reference: record.reference, reason: mail.reason },
      'Order saved, but the notification email was not sent',
    );
  }

  return record;
}
