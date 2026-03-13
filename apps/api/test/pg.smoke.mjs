import assert from 'node:assert/strict';

import { createApp } from '../dist/app.js';
import { env } from '../dist/config/env.js';

function parseSetCookie(setCookie) {
  const [pair] = setCookie.split(';', 1);
  const idx = pair.indexOf('=');
  if (idx <= 0) return null;
  const name = pair.slice(0, idx).trim();
  const value = pair.slice(idx + 1).trim();
  if (!name) return null;
  return { name, value };
}

function getSetCookies(res) {
  if (typeof res.headers.getSetCookie === 'function')
    return res.headers.getSetCookie();
  const single = res.headers.get('set-cookie');
  return single ? [single] : [];
}

class CookieJar {
  constructor() {
    /** @type {Map<string, string>} */
    this.map = new Map();
  }

  ingestResponse(res) {
    for (const sc of getSetCookies(res)) {
      const parsed = parseSetCookie(sc);
      if (!parsed) continue;
      if (!parsed.value) this.map.delete(parsed.name);
      else this.map.set(parsed.name, parsed.value);
    }
  }

  header() {
    const parts = [];
    for (const [k, v] of this.map.entries()) parts.push(`${k}=${v}`);
    return parts.join('; ');
  }

  get(name) {
    return this.map.get(name) ?? null;
  }
}

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    server.close();
  }
}

async function run(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

await run('PG: login/register/refresh/orders flow', async () => {
  if (process.env.SMOKE_WITH_DB !== 'true') {
    console.log('skip - set SMOKE_WITH_DB=true to run');
    return;
  }
  requireEnv('DATABASE_URL');

  await withServer(async (baseUrl) => {
    const jar = new CookieJar();

    const identifier = `dev-${crypto.randomUUID()}@example.com`;
    const password = 'dev-password-123';

    {
      const res = await fetch(`${baseUrl}/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      assert.equal(res.status, 201);
    }

    {
      const res = await fetch(`${baseUrl}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      jar.ingestResponse(res);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.equal(body.user.role, 'customer');
    }

    let csrf = jar.get(env.CSRF_COOKIE_NAME);
    assert.ok(csrf);

    // Place order
    let orderId;
    {
      const res = await fetch(`${baseUrl}/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: jar.header(),
          'X-CSRF-Token': csrf,
          'Idempotency-Key': 'pg-test-1',
        },
        body: JSON.stringify({ lines: [{ id: 'x-burger', qty: 1 }] }),
      });
      jar.ingestResponse(res);
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.ok, true);
      orderId = body.order.id;
    }

    // Me orders
    {
      const res = await fetch(`${baseUrl}/v1/me/orders`, {
        headers: { Cookie: jar.header() },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.ok(body.orders.some((o) => o.id === orderId));
    }

    // Refresh rotates tokens
    {
      const res = await fetch(`${baseUrl}/v1/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: jar.header(), 'X-CSRF-Token': csrf },
      });
      jar.ingestResponse(res);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      csrf = jar.get(env.CSRF_COOKIE_NAME);
      assert.ok(csrf);
    }

    // Logout
    {
      const res = await fetch(`${baseUrl}/v1/auth/logout`, {
        method: 'POST',
        headers: { Cookie: jar.header(), 'X-CSRF-Token': csrf },
      });
      jar.ingestResponse(res);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
    }
  });
});
