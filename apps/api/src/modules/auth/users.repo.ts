import { randomUUID } from 'node:crypto';
import type { Role } from '@saborreal/shared';
import type { Pool } from 'pg';

export type DbUser = {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  role: Role;
};

function rowToUser(row: {
  id: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  role: Role;
}): DbUser {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role,
  };
}

export class PgUsersRepo {
  constructor(private pool: Pool) {}

  async create(input: {
    email: string | null;
    phone: string | null;
    passwordHash: string;
    role: Role;
  }): Promise<DbUser> {
    const id = randomUUID();
    const res = await this.pool.query(
      `insert into users (id, email, phone, password_hash, role)
       values ($1, $2, $3, $4, $5)
       returning id, email, phone, password_hash, role`,
      [id, input.email, input.phone, input.passwordHash, input.role],
    );
    return rowToUser(res.rows[0]);
  }

  async findByEmail(email: string): Promise<DbUser | null> {
    const res = await this.pool.query(
      `select id, email, phone, password_hash, role
       from users
       where lower(email) = lower($1)
       limit 1`,
      [email],
    );
    const row = res.rows[0];
    return row ? rowToUser(row) : null;
  }

  async findByPhone(phone: string): Promise<DbUser | null> {
    const res = await this.pool.query(
      `select id, email, phone, password_hash, role
       from users
       where phone = $1
       limit 1`,
      [phone],
    );
    const row = res.rows[0];
    return row ? rowToUser(row) : null;
  }

  async findById(id: string): Promise<DbUser | null> {
    const res = await this.pool.query(
      `select id, email, phone, password_hash, role
       from users
       where id = $1
       limit 1`,
      [id],
    );
    const row = res.rows[0];
    return row ? rowToUser(row) : null;
  }

  async listByRole(role: Role): Promise<Omit<DbUser, 'passwordHash'>[]> {
    const res = await this.pool.query(
      `select id, email, phone, role, created_at
       from users
       where role = $1
       order by created_at desc`,
      [role],
    );
    return res.rows.map(
      (r: {
        id: string;
        email: string | null;
        phone: string | null;
        role: Role;
      }) => ({
        id: r.id,
        email: r.email,
        phone: r.phone,
        role: r.role,
      }),
    );
  }

  async update(
    id: string,
    input: {
      email?: string | null;
      phone?: string | null;
      passwordHash?: string;
    },
  ): Promise<DbUser | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (input.email !== undefined) {
      sets.push(`email = $${idx++}`);
      params.push(input.email);
    }
    if (input.phone !== undefined) {
      sets.push(`phone = $${idx++}`);
      params.push(input.phone);
    }
    if (input.passwordHash !== undefined) {
      sets.push(`password_hash = $${idx++}`);
      params.push(input.passwordHash);
    }

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = now()`);
    params.push(id);

    const res = await this.pool.query(
      `update users set ${sets.join(', ')} where id = $${idx} and role = 'motoboy'
       returning id, email, phone, password_hash, role`,
      params,
    );
    const row = res.rows[0];
    return row ? rowToUser(row) : null;
  }

  async deleteById(id: string, role: Role): Promise<boolean> {
    const res = await this.pool.query(
      `delete from users where id = $1 and role = $2`,
      [id, role],
    );
    return (res.rowCount ?? 0) > 0;
  }
}
