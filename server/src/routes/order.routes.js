// =========================================================
//  Public order API
//
//  POST /api/orders
//    body: { customerName, phone, address, note?, payment,
//            items: [{ code, quantity }], website? }
//    ok:   201 { ok: true, message, id, reference, total }
//    bad:  400 { error: { message, code, details } }  (per-field messages)
//    gone: 409 { error: { code: 'ITEM_UNAVAILABLE', details: { items: [...] } } }
//
//  Prices/totals are computed in order.service.js from the live menu —
//  the client never sends money. Rate limiting (writeLimiter) is applied
//  at the mount point in routes/index.js.
// =========================================================

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { orderBodySchema } from '../validators/order.validators.js';
import { createOrder } from '../services/order.service.js';
import { logger } from '../lib/logger.js';

export const orderRouter = Router();

const SUCCESS_MESSAGE =
  "Order received! We'll call you shortly to confirm delivery.";

orderRouter.post(
  '/',
  validate({ body: orderBodySchema }),
  asyncHandler(async (req, res) => {
    const { website, ...data } = req.valid.body;

    // Honeypot: bot filled the hidden field. Fake a success, store nothing.
    if (website) {
      logger.warn({ ip: req.ip }, 'Order form honeypot triggered — submission ignored');
      return res.status(201).json({ ok: true, message: SUCCESS_MESSAGE });
    }

    const record = await createOrder(data, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      ok: true,
      message: SUCCESS_MESSAGE,
      id: record.id,
      reference: record.reference,
      total: record.total,
    });
  }),
);
