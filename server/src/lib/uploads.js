// =========================================================
//  Menu image uploads (Phase 7)
//
//  The dashboard POSTs the raw file bytes with the image's own
//  Content-Type (image/jpeg | image/png | image/webp) — no
//  multipart parsing library needed.
//
//  Safety rules:
//    - max 2 MB
//    - the file's real type is detected from its first bytes
//      ("magic numbers"); the Content-Type header alone is not trusted
//    - we choose the filename (random hex + detected extension),
//      so a client can never write outside the uploads folder
//    - files live in server/uploads (git-ignored), served at /uploads
// =========================================================

import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { prisma } from './prisma.js';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
export const UPLOAD_URL_PREFIX = '/uploads/';
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const UPLOAD_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Which image format the bytes actually are, or null. */
function detectImageType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

export function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Validate and store an uploaded image.
 * @param {Buffer} buf
 * @returns {Promise<string|null>} the public URL (e.g. "/uploads/ab12….jpg"), or null if not a supported image
 */
export async function saveImage(buf) {
  const ext = detectImageType(buf);
  if (!ext) return null;

  const name = `${randomBytes(12).toString('hex')}.${ext}`;
  ensureUploadDir();
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), buf, { flag: 'wx' });
  return UPLOAD_URL_PREFIX + name;
}

/**
 * Delete an uploaded file once no menu item uses it any more.
 * Best effort: failures are logged, never thrown. Unsplash links are ignored.
 */
export async function removeUploadIfUnused(url) {
  if (typeof url !== 'string' || !url.startsWith(UPLOAD_URL_PREFIX)) return;

  const name = path.basename(url);
  if (!/^[a-f0-9]{24}\.(jpg|png|webp)$/.test(name)) return;

  try {
    const stillUsed = await prisma.menuItem.count({ where: { imageUrl: url } });
    if (stillUsed > 0) return;
    await fs.promises.unlink(path.join(UPLOAD_DIR, name));
  } catch (err) {
    if (err?.code !== 'ENOENT') logger.warn({ err, url }, 'Could not remove unused upload');
  }
}
