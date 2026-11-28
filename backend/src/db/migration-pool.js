import 'dotenv/config';
import pg from 'pg';
import { runtimeConfig } from '../lib/runtime-config.js';

const { Pool } = pg;
const migrationUrl = process.env.DATABASE_MIGRATION_URL?.trim()
  || (runtimeConfig.nodeEnv === 'production' ? '' : process.env.DATABASE_URL?.trim());

if (!migrationUrl) {
  throw new Error('DATABASE_MIGRATION_URL is required for production database migrations.');
}

export const migrationPool = new Pool({
  connectionString: migrationUrl,
  max: 1,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: runtimeConfig.databaseSsl ? { rejectUnauthorized: true } : undefined,
});

export async function closeMigrationPool() {
  await migrationPool.end();
}
