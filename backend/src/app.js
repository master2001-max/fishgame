/**
 * Express Application Factory
 *
 * Location: backend/src/app.js
 * Where it fits: Web Application Configuration. Assembles middleware, routes, and error handlers.
 *
 * Why: Encapsulates app configuration in a factory function (`createApp`) so it can be
 * cleanly imported by both `server.js` (for runtime) and test suites (without port conflicts).
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';

export function createApp() {
  const app = express();

  // 1. Helmet Security Headers (Production Best Practice)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 2. CORS (Cross-Origin Resource Sharing) Whitelist
  app.use(
    cors({
      origin: [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // 3. Rate Limiter (Brute-Force & Denial-of-Service Defense)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  });
  app.use('/api', apiLimiter);

  // 4. Stricter Limiter for Authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // 50 attempts per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again later.' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // 5. JSON Body Parser with reasonable payload limit
  app.use(express.json({ limit: '100kb' }));

  // 6. Health & Diagnostic Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      database: env.DB_DRIVER,
      timestamp: new Date().toISOString(),
    });
  });

  // 7. Route Mounting
  app.use('/api/auth', authRoutes);
  app.use('/api/game', gameRoutes);

  // 8. 404 Route Handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  // 9. Centralized Production Error Handling Middleware
  app.use((err, _req, res, _next) => {
    const status = err.statusCode || 500;

    // Never leak stack traces, service keys, or database internals to the client in production
    const isClientError = status >= 400 && status < 500;
    const message = isClientError ? err.message : 'Internal server error. Please try again later.';

    if (status >= 500) {
      console.error('[ServerError]', {
        message: err.message,
        path: _req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(status).json({ error: message });
  });

  return app;
}
