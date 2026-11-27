import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../src/app.js';

test('API Explorer and OpenAPI are unavailable in production', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const server = createApp().listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const [spec, explorer] = await Promise.all([
      fetch(`${baseUrl}/api/openapi.json`),
      fetch(`${baseUrl}/api/docs/`),
    ]);

    assert.equal(spec.status, 404);
    assert.equal(explorer.status, 404);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeIdleConnections?.();
    });
  }
});
