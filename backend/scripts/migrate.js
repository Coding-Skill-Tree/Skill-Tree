import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool, closePool } from '../src/db/pool.js';

const migrationsDirectory = fileURLToPath(new URL('../migrations/', import.meta.url));
const lockKey = 746_821_114;

try {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [lockKey]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = await readFile(path.join(migrationsDirectory, file), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query('SELECT checksum FROM schema_migrations WHERE name = $1', [file]);
      if (existing.rowCount) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration was modified: ${file}`);
        console.log(`skip ${file}`);
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name, checksum) VALUES ($1, $2)', [file, checksum]);
        await client.query('COMMIT');
        console.log(`applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1)', [lockKey]); } finally { client.release(); }
  }
} catch (error) {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
