// =========================================================
//  Reservation service — business logic for the booking form.
//  Same shape as contact.service.js: store first, notify best-effort.
// =========================================================

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { sendNotificationEmail } from '../lib/mailer.js';

/**
 * Store a reservation request and (best effort) email the restaurant.
 *
 * @param {{ name, phone, date, time, guests, seating, note? }} input  already validated
 * @param {{ ip?: string, userAgent?: string }} [meta]
 * @returns {Promise<import('@prisma/client').Reservation>}
 */
export async function createReservation(input, meta = {}) {
  // date + time -> one absolute instant, pinned to Pakistan time (UTC+5).
  const reservedAt = new Date(`${input.date}T${input.time}:00+05:00`);

  const record = await prisma.reservation.create({
    data: {
      name: input.name,
      phone: input.phone,
      date: input.date,
      time: input.time,
      reservedAt,
      guests: input.guests,
      seating: input.seating,
      note: input.note ?? '',
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  const mail = await sendNotificationEmail({
    subject: `New reservation — ${record.name}, ${record.date} ${record.time}`,
    text: [
      `Name:    ${record.name}`,
      `Phone:   ${record.phone}`,
      `Date:    ${record.date}`,
      `Time:    ${record.time}`,
      `Guests:  ${record.guests}`,
      `Seating: ${record.seating}`,
      record.note ? `Note:    ${record.note}` : null,
      '',
      `Received ${record.createdAt.toISOString()}`,
    ]
      .filter((line) => line !== null)
      .join('\n'),
  });

  if (!mail.sent) {
    logger.warn(
      { reservationId: record.id, reason: mail.reason },
      'Reservation saved, but the notification email was not sent',
    );
  }

  return record;
}
