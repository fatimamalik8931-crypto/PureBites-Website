// =========================================================
//  Public reservation API
//
//  POST /api/reservations
//    body: { name, phone, date, time, guests, seating, note?, website? }
//    ok:   201 { ok: true, message, id }
//    bad:  400 { error: { message, code, details } }  (per-field messages)
//
//  Rate limiting (writeLimiter) is applied at the mount point in routes/index.js.
// =========================================================

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { reservationBodySchema } from '../validators/reservation.validators.js';
import { createReservation } from '../services/reservation.service.js';
import { logger } from '../lib/logger.js';

export const reservationRouter = Router();

const SUCCESS_MESSAGE =
  "Thanks! Your reservation request has been received — we'll confirm by phone shortly.";

reservationRouter.post(
  '/',
  validate({ body: reservationBodySchema }),
  asyncHandler(async (req, res) => {
    const { website, ...data } = req.valid.body;

    // Honeypot: bot filled the hidden field. Fake a success, store nothing.
    if (website) {
      logger.warn({ ip: req.ip }, 'Reservation form honeypot triggered — submission ignored');
      return res.status(201).json({ ok: true, message: SUCCESS_MESSAGE });
    }

    const record = await createReservation(data, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({ ok: true, message: SUCCESS_MESSAGE, id: record.id });
  }),
);
