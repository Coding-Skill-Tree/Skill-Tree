import { HttpError, validationError } from '../lib/http-error.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export async function readActiveCatalogVersion(database) {
  const result = await database.query(
    `SELECT COALESCE(MAX(s.catalog_version), 1)::int AS version
     FROM skills s
     JOIN skill_categories c ON c.id = s.category_id
     WHERE s.active = true AND c.active = true`,
  );
  return result.rows[0].version;
}

// Call only inside a transaction after C has finalized a passing attempt.
// The user ID must come from the verified session, never from request input.
export async function recordSkillCompletion(database, { userId, skillId, attemptId }) {
  if (!/^[1-9]\d*$/u.test(String(userId))) {
    throw validationError({ userId: '會員身份無效' });
  }
  if (typeof skillId !== 'string' || !skillId || skillId.length > 80) {
    throw validationError({ skillId: '技能節點無效' });
  }
  if (typeof attemptId !== 'string' || !UUID_PATTERN.test(attemptId)) {
    throw validationError({ attemptId: '測驗紀錄無效' });
  }

  const attempt = await database.query(
    `SELECT 1 FROM quiz_attempts
     WHERE id = $1 AND user_id = $2 AND skill_id = $3
       AND status = 'completed' AND passed = true
     FOR SHARE`,
    [attemptId, userId, skillId],
  );
  if (!attempt.rowCount) {
    throw new HttpError(409, 'SKILL_COMPLETION_REQUIRES_PASSED_ATTEMPT', '必須先完成並通過此技能測驗');
  }

  const inserted = await database.query(
    `INSERT INTO user_skill_completions(user_id, skill_id, first_passed_attempt_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, skill_id) DO NOTHING
     RETURNING skill_id`,
    [userId, skillId, attemptId],
  );
  const wasAdded = inserted.rowCount === 1;

  const revision = wasAdded
    ? await database.query(
      `INSERT INTO user_progress_revisions(user_id, revision, updated_at)
       VALUES ($1, 1, now())
       ON CONFLICT (user_id) DO UPDATE SET
         revision = user_progress_revisions.revision + 1,
         updated_at = now()
       RETURNING revision::text AS revision`,
      [userId],
    )
    : await database.query(
      `SELECT revision::text AS revision FROM user_progress_revisions WHERE user_id = $1`,
      [userId],
    );

  return {
    completed: true,
    newlyCompleted: wasAdded,
    revision: revision.rows[0]?.revision ?? '0',
  };
}
