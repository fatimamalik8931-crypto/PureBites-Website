// =========================================================
//  Admin service — auth business logic. Routes stay thin.
// =========================================================

import { prisma } from '../lib/prisma.js';
import { verifyPassword } from '../lib/password.js';

/**
 * Check an email + password pair.
 *
 * Always runs a bcrypt comparison — even when the email doesn't exist
 * verifyPassword() hashes against a dummy — so the response time can't
 * be used to tell "no such account" from "wrong password".
 *
 * @param {string} email     already lower-cased by the validator
 * @param {string} password
 * @returns {Promise<{id,email,name}|null>}  the admin on success, else null
 */
export async function authenticateAdmin(email, password) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  const ok = await verifyPassword(password, admin?.passwordHash);
  if (!ok || !admin.isActive) return null;

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return { id: admin.id, email: admin.email, name: admin.name };
}
