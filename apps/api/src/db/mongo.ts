import { MongoClient } from 'mongodb';

import { env } from '../config/env.js';

let client: MongoClient | null = null;

export function getMongoClient(): MongoClient | null {
  if (!env.MONGO_URI) return null;
  if (client) return client;

  client = new MongoClient(env.MONGO_URI, {
    // Prefer explicit timeouts to avoid hanging requests.
    serverSelectionTimeoutMS: 2_000,
  });

  return client;
}

export function getMongoDb() {
  const c = getMongoClient();
  if (!c) return null;
  return c.db(env.MONGO_DB);
}

export async function mongoPing() {
  const c = getMongoClient();
  if (!c) return { ok: false as const, reason: 'MONGO_URI_not_set' as const };

  // connect() is idempotent for MongoClient.
  await c.connect();
  await c.db(env.MONGO_DB).command({ ping: 1 });

  return { ok: true as const };
}
