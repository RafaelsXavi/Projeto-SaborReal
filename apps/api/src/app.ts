import type { IncomingMessage } from 'node:http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Request, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { AppError, errorHandler, notFoundHandler } from './middleware/error.js';
import { requestId } from './middleware/requestId.js';
import { csrfProtection, jwtAuth } from './modules/auth/auth.middleware.js';
import { routes } from './routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(requestId());

  // pino-http types are based on IncomingMessage/ServerResponse; at runtime this is the Express request.
  const httpLogger = pinoHttp({
    logger,
    genReqId: (req: IncomingMessage) => (req as any).id,
  }) as unknown as RequestHandler;
  app.use(httpLogger);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          fontSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }) as unknown as RequestHandler,
  );

  const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  const allowList =
    env.CORS_ORIGINS.length > 0
      ? env.CORS_ORIGINS
      : env.NODE_ENV === 'production'
        ? []
        : defaultDevOrigins;

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (allowList.includes(origin)) return cb(null, true);
        return cb(new AppError('CORS_NOT_ALLOWED', 403));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-Id',
        'Idempotency-Key',
        'X-CSRF-Token',
      ],
      exposedHeaders: ['X-Request-Id'],
    }) as unknown as RequestHandler,
  );

  app.use(express.json({ limit: '200kb' }) as unknown as RequestHandler);
  app.use(express.urlencoded({ extended: false }) as unknown as RequestHandler);
  app.use(cookieParser() as unknown as RequestHandler);
  app.use(jwtAuth());
  app.use(csrfProtection());

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }) as unknown as RequestHandler,
  );

  app.use(routes);

  app.use(notFoundHandler());
  app.use(errorHandler());

  return app;
}
