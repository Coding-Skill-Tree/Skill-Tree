import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { devWorkbenchRouter } from '../src/routes/dev-workbench.js';

test('API Explorer, OpenAPI, and workbench are mounted only outside production', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const productionRoutes = createApp().router.stack;
    assert.ok(!productionRoutes.some((layer) => layer.handle === devWorkbenchRouter));
    assert.ok(!productionRoutes.some((layer) => layer.route?.path === '/api/openapi.json'));

    process.env.NODE_ENV = 'development';
    const developmentRoutes = createApp().router.stack;
    assert.ok(developmentRoutes.some((layer) => layer.handle === devWorkbenchRouter));
    assert.ok(developmentRoutes.some((layer) => layer.route?.path === '/api/openapi.json'));
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
