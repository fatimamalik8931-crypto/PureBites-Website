// =========================================================
//  Public contact form API
//
//  POST /api/contact
//    body: { name, email, message, website? }
//    ok:   201 { ok: true, message, id }
//    bad:  400 { error: { message, code, details } }  (per-field messages)
//
//  Rate limiting (writeLimiter) is applied where this router is mounted,
//  in routes/index.js.
// =========================================================

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { contactBodySchema } from '../validators/contact.validators.js';
import { createContactMessage } from '../services/contact.service.js';
import { logger } from '../lib/logger.js';

export const contactRouter = Router();

const SUCCESS_MESSAGE = 'Thank you! Your message has been received.';

contactRouter.post(
  '/',
  validate({ body: contactBodySchema }),
  asyncHandler(async (req, res) => {
    const { name, email, message, website } = req.valid.body;

    // Honeypot: only a bot fills the hidden `website` field. Respond exactly
    // like a real success so we don't teach the bot to adapt — but store
    // nothing and send no email.
    if (website) {
      logger.warn({ ip: req.ip }, 'Contact form honeypot triggered — submission ignored');
      return res.status(201).json({ ok: true, message: SUCCESS_MESSAGE });
    }

    const record = await createContactMessage(
      { name, email, message },
      { ip: req.ip, userAgent: req.get('user-agent') },
    );

    res.status(201).json({ ok: true, message: SUCCESS_MESSAGE, id: record.id });
  }),
);
