// =========================================================
//  Password hashing (bcrypt, via the pure-JS `bcryptjs`).
//
//  We never store a raw password. `hashPassword` turns it into
//  a one-way bcrypt hash; `verifyPassword` checks a login attempt
//  against a stored hash. bcrypt is deliberately slow, which is
//  what makes stolen hashes expensive to crack.
//
//  bcryptjs (no native build step) is used so `npm install` works
//  the same on every machine, Windows included.
// =========================================================

import bcrypt from 'bcryptjs';

/** Work factor. 10 rounds ≈ ~100 ms/hash — slow for attackers, fine for a login. */
const SALT_ROUNDS = 10;

/**
 * A valid bcrypt hash of a random string. Used by verifyPassword() when the
 * email doesn't exist, so a "no such user" response takes the same amount of
 * time as a "wrong password" one — an attacker can't tell them apart by timing.
 */
const DUMMY_HASH = '$2b$10$C6UzMDM.H6dfI/f/IKcEeO.PjydmB8h0f0.7mZ6QOaMDX6y6uH8dm';

/** @param {string} plain @returns {Promise<string>} bcrypt hash */
export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * @param {string} plain        the password entered at login
 * @param {string|null} hash    the stored hash, or null/undefined if no user
 * @returns {Promise<boolean>}  true only when they match
 */
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash || DUMMY_HASH).then((ok) => Boolean(hash) && ok);
}
