import type { Role } from '@saborreal/shared';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      auth?: { userId: string; role: Role };
      cookies?: Record<string, string>;
    }
  }
}

export {};

