import 'dotenv/config';
import { pool, closePool } from '../src/db/pool.js';
import { getQaFixtureIds, QA_FIXTURE_SKILL_ID } from '../src/lib/qa-fixture.js';

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!/^[^@\s]+@[^@\s]+\.test$/u.test(email)) {
  console.error('Usage: npm run db:qa-fixtures:clean -- verified-member@example.test');
  process.exitCode = 1;
} else {
  const client = await pool.connect();
  try {
    if (process.env.NODE_ENV === 'production') throw new Error('Refusing to clean QA fixtures in production.');
    const database = await client.query('SELECT current_database() AS name');
    if (!database.rows[0].name.endsWith('_dev')) throw new Error('QA cleanup is restricted to a local database whose name ends in _dev.');

    const memberResult = await client.query('SELECT id FROM users WHERE email_normalized = $1', [email]);
    if (!memberResult.rowCount) throw new Error('No matching synthetic .test member exists.');
    const userId = memberResult.rows[0].id;
    const skillId = QA_FIXTURE_SKILL_ID;
    const { attemptId, eventId } = getQaFixtureIds(userId, skillId);

    await client.query('BEGIN');
    const attemptResult = await client.query(
      `SELECT user_id::text AS "userId", skill_id AS "skillId", status
       FROM quiz_attempts WHERE id = $1 FOR UPDATE`,
      [attemptId],
    );
    if (attemptResult.rowCount && (attemptResult.rows[0].userId !== String(userId) || attemptResult.rows[0].skillId !== skillId)) {
      throw new Error('Deterministic QA attempt ID belongs to different data; transaction rolled back.');
    }

    const eventResult = await client.query(
      `SELECT event_id AS "eventId", user_id::text AS "userId", payload
       FROM xp_outbox WHERE event_id = $1 FOR UPDATE`,
      [eventId],
    );
    if (eventResult.rowCount && (eventResult.rows[0].userId !== String(userId) || eventResult.rows[0].payload?.qaFixture !== true)) {
      throw new Error('The event is not marked as this QA fixture; refusing to delete it.');
    }
    const ledgerResult = await client.query(
      'SELECT user_id::text AS "userId", reason FROM xp_ledger WHERE event_id = $1 FOR UPDATE',
      [eventId],
    );
    if (ledgerResult.rowCount && (ledgerResult.rows[0].userId !== String(userId) || ledgerResult.rows[0].reason !== 'qa_fixture')) {
      throw new Error('The ledger entry is not marked as this QA fixture; refusing to delete it.');
    }

    const completion = await client.query(
      `SELECT first_passed_attempt_id AS "attemptId"
       FROM user_skill_completions WHERE user_id = $1 AND skill_id = $2 FOR UPDATE`,
      [userId, skillId],
    );
    if (completion.rowCount && completion.rows[0].attemptId !== attemptId) {
      throw new Error('A different completion exists; leaving the member progress untouched.');
    }

    await client.query('DELETE FROM xp_ledger WHERE event_id = $1 AND reason = $2', [eventId, 'qa_fixture']);
    await client.query('DELETE FROM xp_outbox WHERE event_id = $1 AND payload->>\'qaFixture\' = \'true\'', [eventId]);
    await client.query('DELETE FROM user_skill_completions WHERE user_id = $1 AND skill_id = $2 AND first_passed_attempt_id = $3', [userId, skillId, attemptId]);
    await client.query('DELETE FROM quiz_attempts WHERE id = $1 AND user_id = $2 AND skill_id = $3', [attemptId, userId, skillId]);
    await client.query('COMMIT');
    console.log(`QA progress fixture removed for ${email}. The account/profile and monotonic progress revision are retained.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('QA fixture cleanup failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await closePool();
  }
}
