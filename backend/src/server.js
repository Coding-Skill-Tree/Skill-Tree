import 'dotenv/config';
import { closePool } from './db/pool.js';
import { runtimeConfig } from './lib/runtime-config.js';
import { app } from './app.js';
import { validateEmailRuntime } from './services/email-service.js';

validateEmailRuntime();
const server = app.listen(runtimeConfig.port, () => {
  console.log(`Skill Tree API listening on http://localhost:${runtimeConfig.port}`);
});

let shutdownPromise;
async function shutdown(signal) {
  if (shutdownPromise) return shutdownPromise;
  console.log(`${signal} received; shutting down gracefully`);
  shutdownPromise = new Promise((resolve) => {
    server.close(async (error) => {
      try {
        await closePool();
      } catch (closeError) {
        console.error('Failed to close PostgreSQL pool:', closeError.message);
        process.exitCode = 1;
      }
      if (error) {
        console.error('Failed to close HTTP server:', error.message);
        process.exitCode = 1;
      }
      resolve();
    });
    server.closeIdleConnections?.();
  });
  return shutdownPromise;
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
