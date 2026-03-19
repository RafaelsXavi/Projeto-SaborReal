import assert from 'node:assert/strict';
import { createApp } from '../src/app.ts';
import { env } from '../src/config/env.ts';

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

if (!env.DEV_AUTH_ENABLED) {
  console.log('Skipping mock auth tests (DEV_AUTH_ENABLED is false)');
} else {
  await run('POST /v1/auth/login works with mock admin account', async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin@saborreal.com',
          password: 'admin1234',
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.equal(body.user.role, 'admin');
      assert.equal(body.user.userId, 'mock-admin');
    });
  });

  await run('POST /v1/auth/login works with mock motoboy account', async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'motoboy@saborreal.com',
          password: 'motoboy1234',
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.equal(body.user.role, 'motoboy');
    });
  });

  await run(
    'POST /v1/auth/login fails with invalid mock password',
    async () => {
      await withServer(async (baseUrl) => {
        const res = await fetch(`${baseUrl}/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: 'admin@saborreal.com',
            password: 'WRONG',
          }),
        });

        // It should fall through to real DB check which will fail (ECONNREFUSED)
        // or if DB is connected, it fails because password is wrong
        assert.notEqual(res.status, 200);
      });
    },
  );
}
