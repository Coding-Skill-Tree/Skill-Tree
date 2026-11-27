import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readWorkbenchSource } from '../src/routes/dev-workbench.js';

test('workbench source reader returns only a bounded, allowlisted project file', async () => {
  const source = await readWorkbenchSource('quiz-routes');
  assert.equal(source.path, 'backend/src/routes/quizzes.js');
  assert.match(source.content, /IDEMPOTENCY_KEY_REUSED/u);
  assert.ok(Buffer.byteLength(source.content, 'utf8') <= 48 * 1024);

  await assert.rejects(
    readWorkbenchSource('../.env'),
    (error) => error.status === 404 && error.code === 'SOURCE_NOT_AVAILABLE',
  );
});
