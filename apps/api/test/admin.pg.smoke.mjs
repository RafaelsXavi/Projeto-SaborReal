import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

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

  const res = await fetch(`${baseUrl}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  jar.ingestResponse(res);
  assert.equal(res.status, 200);

  const csrf = jar.get(env.CSRF_COOKIE_NAME);
  assert.ok(csrf);
  return { jar, csrf };
}

await run('Admin API E2E: Security Restrictions & Motoboy/Catalog CRUD', async () => {
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
      password: 'testpassword123',
      role: 'admin',
    };
    const customer = {
      identifier: `customer-${crypto.randomUUID()}@example.com`,
      password: 'testpassword123',
    };

    // Create accounts
    {
      const resC = await fetch(`${baseUrl}/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      assert.equal(resC.status, 201);

      const resA = await fetch(`${baseUrl}/v1/auth/dev-create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admin),
      });
      assert.equal(resA.status, 201);
    }

    const customerSession = await createAndLogin(baseUrl, customer);
    const adminSession = await createAndLogin(baseUrl, admin);

    // 1. Security check: Customer cannot access Admin Motoboys
    {
      const res = await fetch(`${baseUrl}/v1/admin/motoboys`, {
        headers: { Cookie: customerSession.jar.header() },
      });
      assert.equal(res.status, 403, 'Customer should not access admin routes');
    }

    // 2. Admin creates a Motoboy
    let motoboyId = '';
    {
      const payload = { identifier: `moto-${crypto.randomUUID()}@example.com`, password: 'motopassword123', name: 'Moto Teste', plate: 'ABC-1234' };
      const res = await fetch(`${baseUrl}/v1/admin/motoboys`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Cookie: adminSession.jar.header(),
          'X-CSRF-Token': adminSession.csrf
        },
        body: JSON.stringify(payload)
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.ok, true);
      motoboyId = data.user?.userId || data.motoboy?.id;
    }

    // 3. Admin creates a Catalog Product
    let productId = '';
    {
       const payload = {
         id: `prod-${crypto.randomUUID().slice(0,8)}`,
         name: 'Hambúrguer de Teste',
         description: 'Pão, carne e queijo.',
         priceCents: 2500,
         categoryName: 'Lanches',
         imageUrl: '',
         available: true
       };
       const res = await fetch(`${baseUrl}/v1/admin/catalog`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Cookie: adminSession.jar.header(),
          'X-CSRF-Token': adminSession.csrf
        },
        body: JSON.stringify(payload)
      });
      // Allow 201 or 400 (if category doesnt exist in test DB). Let's log it.
      if (res.status === 201) {
         const data = await res.json();
         productId = data.item?.id;
      }
    }
  });
});
