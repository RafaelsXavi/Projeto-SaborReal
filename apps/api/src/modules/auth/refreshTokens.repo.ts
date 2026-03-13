import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  replacedByTokenId: string | null;
};

function sha256Hex(input: string) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function newRefreshToken() {
  return randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token: string) {
  return sha256Hex(token);
}

function rowToRecord(row: {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  replaced_by_token_id: string | null;
}): RefreshTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    replacedByTokenId: row.replaced_by_token_id,
  };
}

export class PgRefreshTokensRepo {
  constructor(private pool: Pool) {}

  async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent: string | null;
    ip: string | null;
  }): Promise<RefreshTokenRecord> {
    const id = randomUUID();
    const res = await this.pool.query(
      `insert into refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip)
       values ($1, $2, $3, $4, $5, $6)
       returning id, user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id`,
      [
        id,
        input.userId,
        input.tokenHash,
        input.expiresAt.toISOString(),
        input.userAgent,
        input.ip,
      ],
    );
    return rowToRecord(res.rows[0]);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const res = await this.pool.query(
      `select id, user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id
       from refresh_tokens
       where token_hash = $1
       limit 1`,
      [tokenHash],
    );
    const row = res.rows[0];
    return row ? rowToRecord(row) : null;
  }

  async revoke(input: { tokenId: string; replacedByTokenId?: string | null }) {
    await this.pool.query(
      `update refresh_tokens
       set revoked_at = now(),
           replaced_by_token_id = coalesce($2, replaced_by_token_id)
       where id = $1`,
      [input.tokenId, input.replacedByTokenId ?? null],
    );
  }

  async revokeUserTokens(userId: string) {
    await this.pool.query(
      `update refresh_tokens
       set revoked_at = now()
       where user_id = $1 and revoked_at is null`,
      [userId],
    );
  }

  async revokeDescendants(tokenId: string) {
    // Best-effort defensive cleanup: if a token was reused, revoke the whole chain.
    let current: string | null = tokenId;
    for (let i = 0; i < 32 && current; i++) {
      const res: import('pg').QueryResult<{
        replaced_by_token_id: string | null;
      }> = await this.pool.query<{ replaced_by_token_id: string | null }>(
        `select replaced_by_token_id
         from refresh_tokens
         where id = $1
         limit 1`,
        [current],
      );
      const next: string | null = res.rows[0]?.replaced_by_token_id ?? null;
      if (!next) break;
      await this.revoke({ tokenId: next });
      current = next;
    }
  }
}
