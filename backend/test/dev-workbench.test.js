import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readWorkbenchSource } from '../src/routes/dev-workbench.js';

test('workbench source reader returns only a bounded, allowlisted project file', async () => {
  const source = await readWorkbenchSource('question-bank');
  assert.equal(source.path, 'backend/src/services/question-bank.js');
  assert.match(source.content, /listPublishedQuestionsForSkill/u);
  assert.ok(Buffer.byteLength(source.content, 'utf8') <= 48 * 1024);

  for (const sourceId of ['member-auth-routes', 'member-session-service', 'frontend-register-page', 'frontend-login-page', 'email-code-service', 'xp-event-producer', 'migration-012', 'integration-guide-a', 'integration-guide-b', 'integration-guide-c', 'integration-guide-d']) {
    const approvedSource = await readWorkbenchSource(sourceId);
    assert.ok(approvedSource.content.length > 0, `${sourceId} should be readable from the explicit allowlist`);
    assert.ok(Buffer.byteLength(approvedSource.content, 'utf8') <= 48 * 1024, `${sourceId} should stay within the source-size limit`);
  }

  await assert.rejects(
    readWorkbenchSource('../.env'),
    (error) => error.status === 404 && error.code === 'SOURCE_NOT_AVAILABLE',
  );
});
