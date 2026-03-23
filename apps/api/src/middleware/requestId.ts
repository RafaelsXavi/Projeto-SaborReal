import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export function requestId() {
  const handler: RequestHandler = (req, res, next) => {
    const id = randomUUID();
    (req as any).id = id;
    // Express types can vary between runtimes/builds; keep this resilient.
    (res as any).setHeader?.('X-Request-Id', id);
    (res as any).set?.('X-Request-Id', id);
    (next as any)();
  };
  return handler;
}
