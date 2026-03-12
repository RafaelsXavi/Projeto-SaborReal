import assert from 'node:assert/strict';

import { createApp } from '../dist/app.js';

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
