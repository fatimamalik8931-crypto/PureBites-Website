// =========================================================
//  Environment loading + validation
//  We validate on startup so a missing/typo'd variable fails
//  loudly here instead of causing a confusing error later.
// =========================================================

import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Comma-separated list of allowed browser origins for CORS.
  CLIENT_ORIGIN: z.string().default('http://localhost:4000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Optional until later phases — validated loosely for now.
  SESSION_SECRET: z.string().default('dev-only-secret-change-me'),
  ADMIN_EMAIL: z.string().email().optional().or(z.literal('')),
  ADMIN_PASSWORD: z.string().optional().or(z.literal('')),
  ADMIN_NAME: z.string().optional().or(z.literal('')),

  SMTP_HOST: z.string().optional().or(z.literal('')),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional().or(z.literal('')),
  SMTP_PASS: z.string().optional().or(z.literal('')),
  NOTIFY_TO: z.string().optional().or(z.literal('')),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Invalid environment configuration:\n');
  console.error(parsed.error.flatten().fieldErrors);
  console.error('\nCopy server/.env.example to server/.env and fill it in.\n');
  process.exit(1);
}

const data = parsed.data;

// ---- Production safety checks (Phase 8) ----
// Refuse to boot in production with settings that would make the admin
// session cookie forgeable.
if (data.NODE_ENV === 'production') {
  const KNOWN_PLACEHOLDERS = ['dev-only-secret-change-me', 'change-me-to-a-long-random-string'];
  if (data.SESSION_SECRET.length < 32 || KNOWN_PLACEHOLDERS.includes(data.SESSION_SECRET)) {
    console.error(
      '\n❌ SESSION_SECRET must be a random string of at least 32 characters in production.\n' +
        '   Generate one with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n',
    );
    process.exit(1);
  }
  if (/localhost|127\.0\.0\.1/.test(data.CLIENT_ORIGIN)) {
    console.warn('⚠  CLIENT_ORIGIN still points at localhost — set it to your real site URL.');
  }
}

export const env = {
  ...data,
  isProd: data.NODE_ENV === 'production',
  isDev: data.NODE_ENV === 'development',
  // Parsed list form of CLIENT_ORIGIN
  clientOrigins: data.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
};
