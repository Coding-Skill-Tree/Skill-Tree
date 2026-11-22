import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from '../src/db/pool.js';

try {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('拒絕在 production 載入展示題與開發資料；此 seed 僅供本機開發資料庫使用。');
  }
  const seedFile = fileURLToPath(new URL('../seeds/development.sql', import.meta.url));
  const sql = await readFile(seedFile, 'utf8');
  await pool.query(sql);
  console.log('Development seed data applied. Demo content is marked is_demo=true.');
} catch (error) {
  console.error('Database seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
