import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import dotenv from 'dotenv';

// Ensure DATABASE_URL is available before importing dist/env (it parses process.env at import time).
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: resolve(process.cwd(), '../../.env') });
}

const { createApp } = await import('../dist/app.js');
const { env } = await import('../dist/config/env.js');

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

async function createAndLogin(baseUrl, { identifier, password }) {
  const jar = new CookieJar();

  // Create user (customer/admin/courier depending on endpoint used before calling this).
  {
    const res = await fetch(`${baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    jar.ingestResponse(res);
    assert.equal(res.status, 200);
  }

  const csrf = jar.get(env.CSRF_COOKIE_NAME);
  assert.ok(csrf);
  return { jar, csrf };
}

await run('Orders E2E: customer -> admin -> courier -> customer', async () => {
  if (process.env.SMOKE_WITH_DB !== 'true') {
    console.log('skip - set SMOKE_WITH_DB=true to run');
    return;
  }

  requireEnv('DATABASE_URL');

  if (process.env.DEV_AUTH_ENABLED !== 'true' && env.DEV_AUTH_ENABLED !== true) {
    console.log('skip - DEV_AUTH_ENABLED must be true to run');
    return;
  }

  await withServer(async (baseUrl) => {
    const admin = {
      identifier: `admin-${crypto.randomUUID()}@example.com`,
      password: 'dev-password-123',
      role: 'admin',
    };
    const courier = {
      identifier: `courier-${crypto.randomUUID()}@example.com`,
      password: 'dev-password-123',
      role: 'courier',
    };
    const customer = {
      identifier: `customer-${crypto.randomUUID()}@example.com`,
      password: 'dev-password-123',
    };

    // Create users
    {
      const res = await fetch(`${baseUrl}/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      assert.equal(res.status, 201);
    }
    for (const u of [admin, courier]) {
      const res = await fetch(`${baseUrl}/v1/auth/dev-create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u),
      });
      assert.equal(res.status, 201);
    }

    const customerSession = await createAndLogin(baseUrl, customer);
    const adminSession = await createAndLogin(baseUrl, admin);
    const courierSession = await createAndLogin(baseUrl, courier);

    // Customer places order
    let orderId;
    {
      const res = await fetch(`${baseUrl}/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: customerSession.jar.header(),
          'X-CSRF-Token': customerSession.csrf,
          'Idempotency-Key': `e2e-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ lines: [{ id: 'x-burger', qty: 1 }] }),
      });
      customerSession.jar.ingestResponse(res);
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.ok, true);
      orderId = body.order.id;
    }

    // Admin sets status -> READY_FOR_PICKUP
    {
      const res = await fetch(`${baseUrl}/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminSession.jar.header(),
          'X-CSRF-Token': adminSession.csrf,
        },
        body: JSON.stringify({ status: 'READY_FOR_PICKUP' }),
      });
      adminSession.jar.ingestResponse(res);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.equal(body.order.status, 'READY_FOR_PICKUP');
    }

    // Courier accepts -> OUT_FOR_DELIVERY
    {
      const res = await fetch(`${baseUrl}/v1/courier/orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          Cookie: courierSession.jar.header(),
          'X-CSRF-Token': courierSession.csrf,
        },
      });
      courierSession.jar.ingestResponse(res);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.equal(body.order.status, 'OUT_FOR_DELIVERY');
      assert.ok(body.order.courierId);
    }

    // Courier completes -> COMPLETED
    {
      const res = await fetch(
        `${baseUrl}/v1/courier/orders/${orderId}/complete`,
        {
          method: 'POST',
          headers: {
            Cookie: courierSession.jar.header(),
            'X-CSRF-Token': courierSession.csrf,
          },
        },
      );
      courierSession.jar.ingestResponse(res);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.equal(body.order.status, 'COMPLETED');
    }

    // Customer sees final status
    {
      const res = await fetch(`${baseUrl}/v1/me/orders`, {
        headers: { Cookie: customerSession.jar.header() },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      const mine = body.orders.find((o) => o.id === orderId);
      assert.ok(mine);
      assert.equal(mine.status, 'COMPLETED');
    }
  });
});

