import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('../', import.meta.url));
const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();

if (process.env.NODE_ENV === 'production') {
  throw new Error('拒絕在 production 環境執行 API 整合測試。');
}
if (!testDatabaseUrl) {
  throw new Error('請先設定獨立測試資料庫 TEST_DATABASE_URL；測試不會使用 DATABASE_URL。');
}

let databaseName;
let testDatabase;
try {
  testDatabase = new URL(testDatabaseUrl);
  databaseName = decodeURIComponent(testDatabase.pathname.replace(/^\//u, '')).toLowerCase();
} catch {
  throw new Error('TEST_DATABASE_URL 不是有效的 PostgreSQL URL。');
}

if (!/(?:^|[_-])test(?:$|[_-])/u.test(databaseName)) {
  throw new Error('為避免修改開發或正式資料，測試資料庫名稱必須包含獨立的 test 字詞，例如 skill_tree_test。');
}

if (process.env.DATABASE_URL) {
  let configuredDatabase;
  try {
    configuredDatabase = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error('DATABASE_URL 不是有效的 PostgreSQL URL。');
  }
  const hostKey = (url) => ['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase())
    ? 'loopback'
    : url.hostname.toLowerCase();
  const portKey = (url) => url.port || '5432';
  if (hostKey(testDatabase) === hostKey(configuredDatabase)
      && portKey(testDatabase) === portKey(configuredDatabase)
      && testDatabase.pathname === configuredDatabase.pathname) {
    throw new Error('TEST_DATABASE_URL 不可指向 DATABASE_URL 使用的資料庫。');
  }
}

const environment = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: testDatabaseUrl,
  DATABASE_MIGRATION_URL: testDatabaseUrl,
  API_RATE_LIMIT_REQUESTS: '10000',
  AUTH_RATE_LIMIT_REQUESTS: '10000',
  APP_ORIGINS: process.env.APP_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173',
};

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: backendDirectory,
    env: environment,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Idempotent migrations are applied twice before tests to catch clean-install and rerun failures.
run([path.join(backendDirectory, 'scripts/migrate.js')]);
run([path.join(backendDirectory, 'scripts/migrate.js')]);
const testFiles = (await readdir(path.join(backendDirectory, 'test')))
  .filter((file) => file.endsWith('.test.js'))
  .sort()
  .map((file) => path.join(backendDirectory, 'test', file));
if (!testFiles.length) throw new Error('找不到 API 測試檔案。');
run(['--test', ...testFiles]);
