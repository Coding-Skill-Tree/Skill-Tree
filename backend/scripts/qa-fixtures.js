import 'dotenv/config';
import { pool, closePool } from '../src/db/pool.js';
import { getQaFixtureIds, QA_FIXTURE_SKILL_ID } from '../src/lib/qa-fixture.js';

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!/^[^@\s]+@[^@\s]+\.test$/u.test(email)) {
  console.error('Usage: npm run db:qa-fixtures -- verified-member@example.test');
  process.exitCode = 1;
} else {
  const client = await pool.connect();
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to load QA fixtures in production.');
    }

    const database = await client.query('SELECT current_database() AS name');
    if (!database.rows[0].name.endsWith('_dev')) {
      throw new Error('QA fixtures are restricted to a local database whose name ends in _dev.');
    }

    const memberResult = await client.query(
      `SELECT id, email_verified_at AS "emailVerifiedAt"
       FROM users WHERE email_normalized = $1`,
      [email],
    );
    const member = memberResult.rows[0];
    if (!member) throw new Error('Create this synthetic .test member through the normal registration flow first.');
    if (!member.emailVerifiedAt) throw new Error('Verify this .test member through the local development email link first.');

    const skillId = QA_FIXTURE_SKILL_ID;
    const skillResult = await client.query('SELECT catalog_version AS version, title FROM skills WHERE id = $1 AND active = true', [skillId]);
    if (!skillResult.rowCount) throw new Error('The html-basics development skill is missing; run db:seed first.');
    const questionResult = await client.query(
      `SELECT id, prompt, choices, answer_mode AS "answerMode",
              correct_choices AS "correctChoices", choice_explanations AS "choiceExplanations",
              correct_choice AS "correctChoice", explanation
       FROM questions
       WHERE skill_id = $1 AND active = true AND is_demo = true
       ORDER BY id
       LIMIT 5`,
      [skillId],
    );
    if (questionResult.rowCount !== 5) throw new Error('At least five active demo questions are required; run db:seed first.');

    const { attemptId, eventId } = getQaFixtureIds(member.id, skillId);
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO member_profiles(user_id, nickname, avatar_id, route, onboarding_completed)
       VALUES ($1, $2, 'leaf', 'beginner', true)
       ON CONFLICT (user_id) DO NOTHING`,
      [member.id, `QA完成-${member.id}`],
    );

    await client.query(
      `INSERT INTO quiz_attempts
        (id, user_id, skill_id, skill_title_snapshot, catalog_version, status, total_questions, correct_count, passed, started_at, completed_at)
       VALUES ($1, $2, $3, $5, $4, 'completed', 5, 4, true, now() - interval '10 minutes', now())
       ON CONFLICT (id) DO NOTHING`,
      [attemptId, member.id, skillId, skillResult.rows[0].version, skillResult.rows[0].title],
    );
    const existingAttempt = await client.query(
      `SELECT user_id::text AS "userId", skill_id AS "skillId", status, correct_count AS "correctCount"
       FROM quiz_attempts WHERE id = $1`,
      [attemptId],
    );
    const attempt = existingAttempt.rows[0];
    if (!attempt || attempt.userId !== String(member.id) || attempt.skillId !== skillId || attempt.status !== 'completed' || attempt.correctCount !== 4) {
      throw new Error('Deterministic QA attempt ID conflicts with different data; transaction rolled back.');
    }

    for (let index = 0; index < questionResult.rows.length; index += 1) {
      const question = questionResult.rows[index];
      const ordinal = index + 1;
      const selectedChoices = ordinal === 5
        ? [(question.correctChoices[0] + 1) % question.choices.length]
        : question.correctChoices;
      const selectedChoice = selectedChoices[0] ?? null;
      await client.query(
        `INSERT INTO quiz_attempt_questions
          (attempt_id, question_id, ordinal, prompt_snapshot, choices_snapshot,
           correct_choice_snapshot, answer_mode_snapshot, correct_choices_snapshot,
           choice_explanations_snapshot, explanation_snapshot, selected_choice, selected_choices, answered_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12::jsonb, now())
         ON CONFLICT (attempt_id, ordinal) DO UPDATE SET
           question_id = EXCLUDED.question_id,
           prompt_snapshot = EXCLUDED.prompt_snapshot,
           choices_snapshot = EXCLUDED.choices_snapshot,
           correct_choice_snapshot = EXCLUDED.correct_choice_snapshot,
           answer_mode_snapshot = EXCLUDED.answer_mode_snapshot,
           correct_choices_snapshot = EXCLUDED.correct_choices_snapshot,
           choice_explanations_snapshot = EXCLUDED.choice_explanations_snapshot,
           explanation_snapshot = EXCLUDED.explanation_snapshot,
           selected_choice = EXCLUDED.selected_choice,
           selected_choices = EXCLUDED.selected_choices,
           answered_at = EXCLUDED.answered_at`,
        [attemptId, question.id, ordinal, question.prompt, JSON.stringify(question.choices), question.correctChoice,
          question.answerMode, JSON.stringify(question.correctChoices), JSON.stringify(question.choiceExplanations),
          question.explanation, selectedChoice, JSON.stringify(selectedChoices)],
      );
    }

    const existingCompletion = await client.query(
      'SELECT first_passed_attempt_id AS "attemptId" FROM user_skill_completions WHERE user_id = $1 AND skill_id = $2 FOR UPDATE',
      [member.id, skillId],
    );
    if (existingCompletion.rowCount && existingCompletion.rows[0].attemptId !== attemptId) {
      throw new Error('Member already has a different official completion for html-basics; refusing to overwrite it.');
    }
    await client.query(
      `INSERT INTO user_skill_completions(user_id, skill_id, first_passed_attempt_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, skill_id) DO NOTHING`,
      [member.id, skillId, attemptId],
    );

    await client.query(
      `INSERT INTO user_progress_revisions(user_id, revision)
       VALUES ($1, 1)
       ON CONFLICT (user_id) DO UPDATE SET revision = GREATEST(user_progress_revisions.revision, 1), updated_at = now()`,
      [member.id],
    );
    await client.query(
      `INSERT INTO xp_outbox(event_id, user_id, source_type, source_id, event_type, amount, payload, status, processed_at)
       VALUES ($1, $2, 'quiz_attempt', $3, 'skill.first_pass', 1,
         '{"qaFixture":true,"note":"1 XP is illustrative fixture data, not the approved product award"}'::jsonb,
         'completed', now())
       ON CONFLICT (source_type, source_id, event_type) DO NOTHING`,
      [eventId, member.id, attemptId],
    );
    const fixtureEvent = await client.query(
      `SELECT event_id AS "eventId", user_id::text AS "userId", amount
       FROM xp_outbox WHERE source_type = 'quiz_attempt' AND source_id = $1 AND event_type = 'skill.first_pass'`,
      [attemptId],
    );
    if (!fixtureEvent.rowCount || fixtureEvent.rows[0].eventId !== eventId || fixtureEvent.rows[0].userId !== String(member.id)) {
      throw new Error('QA XP event conflicts with existing data; transaction rolled back.');
    }
    await client.query(
      `INSERT INTO xp_ledger(event_id, user_id, amount, reason)
       VALUES ($1, $2, 1, 'qa_fixture')
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, member.id],
    );
    await client.query('COMMIT');
    console.log(`QA fixture applied for ${email}: completed html-basics attempt (4/5) and one clearly marked illustrative XP ledger entry.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('QA fixture failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await closePool();
  }
}
