// =========================================================
//  Contact service — business logic for the contact form.
//  Routes stay thin; this is the reusable, testable part.
// =========================================================

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { sendNotificationEmail } from '../lib/mailer.js';

/**
 * Store a contact-form submission and (best effort) email the restaurant.
 *
 * The database write is what must succeed. The email is a nice-to-have on
 * top: if it fails or SMTP isn't set up, we log a warning and still return
 * the saved record so the caller can report success to the visitor.
 *
 * @param {{ name: string, email: string, message: string }} input  already validated
 * @param {{ ip?: string, userAgent?: string }} [meta]
 * @returns {Promise<import('@prisma/client').ContactMessage>}
 */
export async function createContactMessage(input, meta = {}) {
  const record = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      message: input.message,
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  const mail = await sendNotificationEmail({
    subject: `New contact message from ${record.name}`,
    replyTo: record.email,
    text: [
      `Name:  ${record.name}`,
      `Email: ${record.email}`,
      `Time:  ${record.createdAt.toISOString()}`,
      '',
      record.message,
    ].join('\n'),
  });

  if (!mail.sent) {
    logger.warn(
      { contactMessageId: record.id, reason: mail.reason },
      'Contact message saved, but the notification email was not sent',
    );
  }

  return record;
}
