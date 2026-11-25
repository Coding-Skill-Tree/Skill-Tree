import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const backendDirectory = fileURLToPath(new URL('..', import.meta.url));
const entry = 'import("./src/lib/runtime-config.js")';

function loadConfig(overrides = {}) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', entry], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      APP_ORIGINS: 'http://localhost:5173',
      SESSION_COOKIE_SECURE: 'false',
      DATABASE_SSL: 'false',
      ...overrides,
    },
    encoding: 'utf8',
  });
}

test('runtime configuration rejects invalid boolean values', () => {
  const result = loadConfig({ SESSION_COOKIE_SECURE: '0' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SESSION_COOKIE_SECURE 必須是 true 或 false/u);
});

test('production requires HTTPS origins', () => {
  const result = loadConfig({ NODE_ENV: 'production', APP_ORIGINS: 'http://localhost:5173' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /正式環境的 APP_ORIGINS 必須使用 HTTPS/u);
});

test('origin entries cannot include paths', () => {
  const result = loadConfig({ APP_ORIGINS: 'http://localhost:5173/admin' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /只能包含沒有路徑的 HTTP\(S\) origin/u);
});

test('valid runtime config loads without exposing credentials', () => {
  const result = loadConfig({ APP_ORIGINS: 'https://skill.example.test' });
  assert.equal(result.status, 0, result.stderr);
});
