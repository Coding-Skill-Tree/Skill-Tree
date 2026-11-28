import { randomUUID } from 'node:crypto';
import { HttpError, validationError } from '../lib/http-error.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

// Call from the same transaction that inserts user_skill_completions and bumps
// user_progress_revisions. Only the first-passing attempt may emit this event.
export async function enqueueSkillFirstPassXpEvent(database, { userId, skillId, attemptId }) {
  if (!/^[1-9][0-9]*$/u.test(String(userId))) {
    throw validationError({ userId: '會員身份無效' });
  }
  if (typeof skillId !== 'string' || !skillId || skillId.length > 80) {
    throw validationError({ skillId: '技能 ID 無效' });
  }
  if (typeof attemptId !== 'string' || !UUID_PATTERN.test(attemptId)) {
    throw validationError({ attemptId: '測驗紀錄無效' });
  }

  const completion = await database.query(
    `SELECT attempt.catalog_version AS "catalogVersion", attempt.completed_at AS "completedAt"
     FROM user_skill_completions AS completion
     JOIN quiz_attempts AS attempt
       ON attempt.id = completion.first_passed_attempt_id
      AND attempt.user_id = completion.user_id
      AND attempt.skill_id = completion.skill_id
     WHERE completion.user_id = $1
       AND completion.skill_id = $2
       AND completion.first_passed_attempt_id = $3
       AND attempt.status = 'completed'
       AND attempt.passed = true
       AND attempt.completed_at IS NOT NULL
     FOR SHARE OF completion, attempt`,
    [userId, skillId, attemptId],
  );
  if (!completion.rowCount) {
    throw new HttpError(409, 'XP_EVENT_REQUIRES_FIRST_COMPLETION', 'XP event 必須對應會員首次通過的測驗');
  }

  const data = {
    skillId,
    attemptId,
    catalogVersion: completion.rows[0].catalogVersion,
    completedAt: completion.rows[0].completedAt.toISOString(),
  };
  const eventId = randomUUID();
  const inserted = await database.query(
    `INSERT INTO xp_outbox
       (event_id, user_id, source_type, source_id, event_type, amount, payload)
     VALUES ($1, $2, 'quiz_attempt', $3, 'skill.first_pass', NULL, $4::jsonb)
     ON CONFLICT (source_type, source_id, event_type) DO NOTHING
     RETURNING event_id::text AS "eventId"`,
    [eventId, userId, attemptId, JSON.stringify(data)],
  );
  if (inserted.rowCount) return { eventId: inserted.rows[0].eventId, created: true };

  const existing = await database.query(
    `SELECT event_id::text AS "eventId", user_id::text AS "userId", amount, payload
     FROM xp_outbox
     WHERE source_type = 'quiz_attempt'
       AND source_id = $1
       AND event_type = 'skill.first_pass'
     FOR SHARE`,
    [attemptId],
  );
  const row = existing.rows[0];
  const existingCompletedAt = Date.parse(row?.payload?.completedAt);
  if (
    !row
    || row.userId !== String(userId)
    || row.amount !== null
    || row.payload?.skillId !== data.skillId
    || row.payload?.attemptId !== data.attemptId
    || Number(row.payload?.catalogVersion) !== data.catalogVersion
    || !Number.isFinite(existingCompletedAt)
    || new Date(existingCompletedAt).toISOString() !== data.completedAt
  ) {
    throw new HttpError(409, 'XP_EVENT_SOURCE_CONFLICT', '同一首通來源已存在不同的 XP event');
  }

  return { eventId: row.eventId, created: false };
}
