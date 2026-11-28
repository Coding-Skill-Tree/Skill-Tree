import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const backendDirectory = fileURLToPath(new URL('..', import.meta.url));

function runTestRunner(overrides = {}) {
  return spawnSync(process.execPath, ['scripts/test-api.js'], {
    cwd: backendDirectory,
    env: {
      PATH: process.env.PATH,
      NODE_ENV: 'test',
      DATABASE_URL: '',
      TEST_DATABASE_URL: 'postgresql://test_user@127.0.0.1:55432/skill_tree_test',
      ...overrides,
    },
    encoding: 'utf8',
  });
}

test('API test runner refuses production mode', () => {
  const result = runTestRunner({ NODE_ENV: 'production' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /拒絕在 production 環境執行/u);
});

test('API test runner refuses the configured development database', () => {
  const result = runTestRunner({
    DATABASE_URL: 'postgresql://app:secret@localhost:5432/skill_tree_test',
    TEST_DATABASE_URL: 'postgresql://test_user@127.0.0.1:5432/skill_tree_test',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /不可指向 DATABASE_URL 使用的資料庫/u);
});

test('API test runner requires a dedicated test database name', () => {
  const result = runTestRunner({
    TEST_DATABASE_URL: 'postgresql://test_user@127.0.0.1:55432/skill_tree_dev',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /資料庫名稱必須包含獨立的 test 字詞/u);
});
