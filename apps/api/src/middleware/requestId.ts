import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export function requestId() {
  const handler: RequestHandler = (req, res, next) => {
    const id = randomUUID();
    req.id = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
  return handler;
}
