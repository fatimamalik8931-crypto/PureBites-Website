// =========================================================
//  Express application setup
//  (kept separate from server.js so it can be imported by tests
//   later without starting a real network listener)
// =========================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { apiRouter } from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The existing static frontend lives at the project root (one level above server/).
const FRONTEND_DIR = path.resolve(__dirname, '../../');

export function createApp() {
  const app = express();

  // Behind a reverse proxy in production (Render/Railway/Nginx) so that
  // req.ip and rate-limiting see the real client address.
  app.set('trust proxy', 1);

  // ---- Security headers ----
  // The Content-Security-Policy is tuned to exactly what the current
  // frontend uses: Google Fonts, Unsplash images, and the one inline
  // `onerror` image fallback in script.js. Phase 8 tightens this further.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'script-src-attr': ["'unsafe-inline'"], // allows the <img onerror=...> fallback
          'style-src': ["'self'", 'https://fonts.googleapis.com'],
          'style-src-attr': ["'unsafe-inline'"], // allows JS-set inline styles (animation-delay)
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'img-src': ["'self'", 'data:', 'https://images.unsplash.com'],
          'connect-src': ["'self'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'frame-ancestors': ["'self'"],
          'upgrade-insecure-requests': env.isProd ? [] : null,
        },
      },
      // Allow the page to load cross-origin images (Unsplash) without COEP friction.
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ---- Request logging ----
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  // ---- CORS ----
  // Same-origin in dev (frontend served by this server), but configured
  // so the frontend can later live on a different domain.
  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: true,
    }),
  );

  // ---- Body / cookie parsing ----
  app.use(express.json({ limit: '100kb' })); // JSON bodies only, capped to stop abuse
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser(env.SESSION_SECRET));

  // ---- API ----
  app.use('/api', apiRouter);

  // Unknown /api/* route -> JSON 404 (non-API paths fall through to static files).
  app.use('/api', notFound);

  // ---- Static frontend ----
  // Serves index.html, style.css, script.js exactly as they are on disk.
  app.use(
    express.static(FRONTEND_DIR, {
      index: 'index.html',
      extensions: ['html'],
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );

  // ---- Error handler (must be last) ----
  app.use(errorHandler);

  return app;
}
