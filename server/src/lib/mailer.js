// =========================================================
//  Mailer — best-effort email notifications (Nodemailer).
//
//  Design rule: sending an email must NEVER fail a request. If SMTP
//  isn't configured (dev) or the send errors, we log it and move on —
//  the thing that mattered (saving the message) already happened.
//
//  Configure via .env:
//    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_TO
//  Leave SMTP_USER / SMTP_PASS / NOTIFY_TO blank to disable sending.
// =========================================================

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

/** True only when every value we need to actually send a mail is present. */
export function isMailerConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.NOTIFY_TO);
}

let transporter = null;
let disabledWarningShown = false;

function getTransporter() {
  if (transporter) return transporter;
  if (!isMailerConfigured()) return null;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

/**
 * Send a plain-text notification to the restaurant inbox (NOTIFY_TO).
 *
 * @param {object} opts
 * @param {string} opts.subject
 * @param {string} opts.text      plain-text body
 * @param {string} [opts.replyTo] so hitting "Reply" answers the customer
 * @returns {Promise<{ sent: boolean, reason?: string }>} never throws
 */
export async function sendNotificationEmail({ subject, text, replyTo }) {
  const tx = getTransporter();

  if (!tx) {
    if (!disabledWarningShown) {
      logger.warn('SMTP is not configured — email notifications are disabled (submissions are still saved).');
      disabledWarningShown = true;
    }
    return { sent: false, reason: 'not_configured' };
  }

  try {
    await tx.sendMail({
      from: `"Pure Bites Website" <${env.SMTP_USER}>`,
      to: env.NOTIFY_TO,
      subject,
      text,
      replyTo,
    });
    return { sent: true };
  } catch (err) {
    logger.error({ err }, 'Failed to send notification email');
    return { sent: false, reason: 'send_error' };
  }
}
