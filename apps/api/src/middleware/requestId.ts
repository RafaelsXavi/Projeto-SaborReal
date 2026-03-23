import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = randomUUID();
    (req as any).id = id;
    res.set('X-Request-Id', id);
    next();
  };
}
