import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const backendDirectory = fileURLToPath(new URL('..', import.meta.url));

async function findAvailablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

test('server starts, serves health, and closes cleanly on SIGTERM', { timeout: 15000 }, async () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl, 'TEST_DATABASE_URL is required');
  const port = await findAvailablePort();
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: backendDirectory,
    env: {
      PATH: process.env.PATH,
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      PORT: String(port),
      APP_ORIGINS: 'http://localhost:5173',
      DATABASE_SSL: 'false',
      SESSION_COOKIE_SECURE: 'false',
      PUBLIC_APP_URL: 'http://localhost:5173',
      SMTP_HOST: '',
      SMTP_PORT: '587',
      SMTP_USER: '',
      SMTP_PASSWORD: '',
      SMTP_FROM: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('API startup timed out')), 8000);
      const onOutput = () => {
        if (!output.includes('Skill Tree API listening')) return;
        clearTimeout(timeout);
        child.stdout.off('data', onOutput);
        resolve();
      };
      child.stdout.on('data', onOutput);
      child.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once('exit', (code) => {
        clearTimeout(timeout);
        reject(new Error(`API exited before listening (${code}): ${output}`));
      });
      onOutput();
    });

    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).data.database, 'connected');

    const closed = once(child, 'close');
    child.kill('SIGTERM');
    const [code, signal] = await closed;
    assert.equal(code, 0, output);
    assert.equal(signal, null);
    assert.match(output, /SIGTERM received; shutting down gracefully/u);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await Promise.race([once(child, 'close'), new Promise((resolve) => setTimeout(resolve, 2000))]);
    }
  }
});
