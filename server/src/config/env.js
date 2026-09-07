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

export const env = {
  ...data,
  isProd: data.NODE_ENV === 'production',
  isDev: data.NODE_ENV === 'development',
  // Parsed list form of CLIENT_ORIGIN
  clientOrigins: data.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
};
