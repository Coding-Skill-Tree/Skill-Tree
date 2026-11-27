import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApiRateLimit } from '../src/middleware/api-rate-limit.js';

function responseDouble() {
  return {
    locals: { requestId: 'request-test' },
    headers: {},
    statusCode: 200,
    set(name, value) { this.headers[name] = value; return this; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
}

function request(path, ip = '192.0.2.10') {
  return { originalUrl: path, path, ip, socket: {} };
}

test('API limiter caps a client and returns retry metadata', () => {
  let currentTime = 1000;
  const limit = createApiRateLimit({ apiLimit: 2, authLimit: 1, windowMs: 60_000, now: () => currentTime });
  let passed = 0;
  for (let index = 0; index < 2; index += 1) {
    limit(request('/api/skills'), responseDouble(), () => { passed += 1; });
  }
  const blocked = responseDouble();
  limit(request('/api/skills'), blocked, () => { passed += 1; });

  assert.equal(passed, 2);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.headers['Retry-After'], '60');
  assert.equal(blocked.body.error.code, 'RATE_LIMITED');

  currentTime += 60_001;
  const recovered = responseDouble();
  limit(request('/api/skills'), recovered, () => { passed += 1; });
  assert.equal(passed, 3);
  assert.equal(recovered.statusCode, 200);
});

test('authentication paths have a separate stricter bucket', () => {
  const limit = createApiRateLimit({ apiLimit: 10, authLimit: 1 });
  const first = responseDouble();
  const second = responseDouble();
  limit(request('/api/admin/auth/login'), first, () => {});
  limit(request('/api/auth/register'), second, () => {});
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 429);
});
