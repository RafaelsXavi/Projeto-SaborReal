import type { Pool } from 'pg';

import { PgAuditRepo } from '../audit/audit.repo.js';
import type { JobHandler, JobName } from './jobs.types.js';

const noop: JobHandler = async () => {};

export function createHandlers(pool: Pool): Record<JobName, JobHandler> {
  const audit = new PgAuditRepo(pool);

  return {
    'orders.after_place': async (job) => {
      const payload = job.payload as { orderId?: string; userId?: string };
      if (!payload.orderId || !payload.userId) {
        throw new Error('invalid payload for orders.after_place');
      }
      await audit.insert({
        name: 'orders.placed',
        actorUserId: payload.userId,
        entityType: 'order',
        entityId: payload.orderId,
        payload,
      });
    },
    'orders.after_cancel': async (job) => {
      const payload = job.payload as { orderId?: string; userId?: string };
      if (!payload.orderId || !payload.userId) {
        throw new Error('invalid payload for orders.after_cancel');
      }
      await audit.insert({
        name: 'orders.cancelled',
        actorUserId: payload.userId,
        entityType: 'order',
        entityId: payload.orderId,
        payload,
      });
    },
    'auth.audit_login': noop,
  };
}
