import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';

export type AuditEvent = {
  id: string;
  name: string;
  actorUserId: string | null;
  entityType: string | null;
  entityId: string | null;
  payload: unknown;
  createdAt: string;
};

type DbRow = {
  id: string;
  name: string;
  actor_user_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  payload: unknown;
  created_at: string;
};

function mapRow(row: DbRow): AuditEvent {
  return {
    id: row.id,
    name: row.name,
    actorUserId: row.actor_user_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

export class PgAuditRepo {
  constructor(private pool: Pool) {}

  async insert(input: {
    name: string;
    actorUserId?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    payload?: unknown;
  }) {
    const id = randomUUID();
    await this.pool.query(
      `insert into audit_events (id, name, actor_user_id, entity_type, entity_id, payload)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        input.name,
        input.actorUserId ?? null,
        input.entityType ?? null,
        input.entityId ?? null,
        input.payload ?? {},
      ],
    );
    return id;
  }

  async listRecent(limit = 50): Promise<AuditEvent[]> {
    const res = await this.pool.query<DbRow>(
      `select id, name, actor_user_id, entity_type, entity_id, payload, created_at
       from audit_events
       order by created_at desc
       limit $1`,
      [limit],
    );
    return res.rows.map(mapRow);
  }
}
