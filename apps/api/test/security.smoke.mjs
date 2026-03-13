import assert from 'node:assert/strict';

import { createApp } from '../dist/app.js';
import { env } from '../dist/config/env.js';
import { signAccessToken } from '../dist/modules/auth/jwt.js';

function accessTokenFor(user) {
  return signAccessToken({
    secret: env.JWT_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    ttlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
    userId: user.userId,
    role: user.role,
  });
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

await run('GET /healthz returns ok', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/healthz`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
  });
});

await run(
  'security headers: X-Powered-By disabled and Helmet enabled',
  async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/healthz`);
      assert.equal(res.headers.get('x-powered-by'), null);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    });
  },
);

await run('CORS blocks non-allowlisted origins', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/healthz`, {
      headers: { Origin: 'https://evil.example' },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'CORS_NOT_ALLOWED');
  });
});

await run('RBAC: admin surface requires authentication', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/v1/admin/orders`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error?.code, 'UNAUTHENTICATED');
  });
});

await run('JWT: admin token allows admin surface (Bearer)', async () => {
  await withServer(async (baseUrl) => {
    const accessToken = accessTokenFor({
      userId: crypto.randomUUID(),
      role: 'admin',
    });

    const res = await fetch(`${baseUrl}/v1/admin/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.orders));
  });
});

await run('RBAC: customer token is forbidden on admin surface', async () => {
  await withServer(async (baseUrl) => {
    const accessToken = accessTokenFor({
      userId: crypto.randomUUID(),
      role: 'customer',
    });

    const res = await fetch(`${baseUrl}/v1/admin/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN');
  });
});

await run('Idempotency: same key replays same order', async () => {
  await withServer(async (baseUrl) => {
    const accessToken = accessTokenFor({
      userId: crypto.randomUUID(),
      role: 'customer',
    });

    const body = { lines: [{ id: 'x-burger', qty: 2 }] };

    const first = await fetch(`${baseUrl}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': 'idem-1',
      },
      body: JSON.stringify(body),
    });
    assert.equal(first.status, 201);
    const firstBody = await first.json();
    assert.equal(firstBody.replay, false);
    assert.equal(firstBody.order?.status, 'PLACED');

    const second = await fetch(`${baseUrl}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': 'idem-1',
      },
      body: JSON.stringify(body),
    });
    assert.equal(second.status, 200);
    const secondBody = await second.json();
    assert.equal(secondBody.replay, true);
    assert.equal(secondBody.order?.id, firstBody.order?.id);
  });
});

await run('Orders: customer can cancel own order', async () => {
  await withServer(async (baseUrl) => {
    const accessToken = accessTokenFor({
      userId: crypto.randomUUID(),
      role: 'customer',
    });

    const place = await fetch(`${baseUrl}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': 'cancel-1',
      },
      body: JSON.stringify({ lines: [{ id: 'x-burger', qty: 1 }] }),
    });
    assert.equal(place.status, 201);
    const placed = await place.json();

    const cancel = await fetch(
      `${baseUrl}/v1/me/orders/${placed.order.id}/cancel`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    assert.equal(cancel.status, 200);
    const body = await cancel.json();
    assert.equal(body.ok, true);
    assert.equal(body.order.status, 'CANCELLED');
  });
});

await run('RBAC: courier cannot place orders', async () => {
  await withServer(async (baseUrl) => {
    const accessToken = accessTokenFor({
      userId: crypto.randomUUID(),
      role: 'courier',
    });

    const res = await fetch(`${baseUrl}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': 'idem-x',
      },
      body: JSON.stringify({ lines: [{ id: 'x-burger', qty: 1 }] }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN');
  });
});

await run('CSRF: blocks cookie-auth POST without token', async () => {
  await withServer(async (baseUrl) => {
    const accessToken = accessTokenFor({
      userId: crypto.randomUUID(),
      role: 'customer',
    });
    const csrfToken = crypto.randomUUID();

    const cookieHeader = [
      `${env.ACCESS_TOKEN_COOKIE_NAME}=${accessToken}`,
      `${env.CSRF_COOKIE_NAME}=${csrfToken}`,
    ].join('; ');

    const res = await fetch(`${baseUrl}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
        'Idempotency-Key': 'test-key-csrf',
      },
      body: JSON.stringify({ lines: [{ id: 'x-burger', qty: 1 }] }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'CSRF_INVALID');

    const okRes = await fetch(`${baseUrl}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
        'X-CSRF-Token': csrfToken,
        'Idempotency-Key': 'test-key-1',
      },
      body: JSON.stringify({ lines: [{ id: 'x-burger', qty: 1 }] }),
    });
    assert.equal(okRes.status, 201);
    const okBody = await okRes.json();
    assert.equal(okBody.ok, true);
    assert.equal(okBody.order?.status, 'PLACED');
  });
});

await run(
  'GET /healthz/readyz returns 503 when DBs are not configured',
  async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/healthz/readyz`);
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.error?.code, 'NOT_READY');
    });
  },
);

if (!process.exitCode) {
  console.log('all security smoke tests passed');
}
