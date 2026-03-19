import 'dotenv/config';
import { Pool } from 'pg';
import type { Role } from '@saborreal/shared';

import { env } from '../config/env.js';
import { hashPassword } from '../modules/auth/password.js';
import { PgUsersRepo } from '../modules/auth/users.repo.js';

type Identity = { email: string | null; phone: string | null };

function parseIdentifier(raw: string): Identity {
  const v = raw.trim();
  if (!v) throw new Error('Empty identifier');
  if (v.includes('@')) return { email: v, phone: null };
  return { email: null, phone: v };
}

function mustGet(name: string) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var: ${name}`);
  return v.trim();
}

async function ensureUser(users: PgUsersRepo, input: {
  identifier: string;
  password: string;
  role: Role;
}) {
  if (input.password.length < 8) {
    throw new Error(`Password too short for role=${input.role} (min 8 chars)`);
  }

  const id = parseIdentifier(input.identifier);
  const existing = id.email
    ? await users.findByEmail(id.email)
    : await users.findByPhone(id.phone ?? '');

  if (existing) {
    if (existing.role !== input.role) {
      throw new Error(
        `User already exists but role mismatch for "${input.identifier}": existing=${existing.role} desired=${input.role}`,
      );
    }
    // eslint-disable-next-line no-console
    console.log(`exists role=${existing.role} id=${existing.id}`);
    return;
  }

  const passwordHash = hashPassword(input.password);
  const created = await users.create({
    email: id.email,
    phone: id.phone,
    passwordHash,
    role: input.role,
  });

  // eslint-disable-next-line no-console
  console.log(`created role=${created.role} id=${created.id}`);
}

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set. Cannot bootstrap users.');
  }

  // This script is meant for controlled one-time bootstrapping.
  if (env.NODE_ENV === 'production' && env.DEV_AUTH_ENABLED) {
    throw new Error('Refuse: DEV_AUTH_ENABLED must be false in production.');
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 1,
    ssl: env.PG_SSL
      ? { rejectUnauthorized: env.PG_SSL_REJECT_UNAUTHORIZED }
      : undefined,
  });

  try {
    const users = new PgUsersRepo(pool);

    const adminIdentifier = mustGet('BOOTSTRAP_ADMIN_IDENTIFIER');
    const adminPassword = mustGet('BOOTSTRAP_ADMIN_PASSWORD');

    const motoboyIdentifier =
      process.env.BOOTSTRAP_MOTOBOY_IDENTIFIER?.trim() ??
      process.env.BOOTSTRAP_COURIER_IDENTIFIER?.trim() ??
      '';
    const motoboyPassword =
      process.env.BOOTSTRAP_MOTOBOY_PASSWORD?.trim() ??
      process.env.BOOTSTRAP_COURIER_PASSWORD?.trim() ??
      '';

    await ensureUser(users, {
      identifier: adminIdentifier,
      password: adminPassword,
      role: 'admin',
    });

    if (motoboyIdentifier && motoboyPassword) {
      await ensureUser(users, {
        identifier: motoboyIdentifier,
        password: motoboyPassword,
        role: 'motoboy',
      });
    } else {
      // eslint-disable-next-line no-console
      console.log('skipped motoboy bootstrap (vars not set)');
    }
  } finally {
    await pool.end();
  }
}

await main();
