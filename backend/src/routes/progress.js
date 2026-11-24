import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireMember } from '../middleware/require-member.js';
import { sendSuccess } from '../lib/api-response.js';

export const progressRouter = Router();
progressRouter.get('/progress', requireMember, async (request, response, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const revisionResult = await client.query(
      'SELECT revision::text AS revision FROM user_progress_revisions WHERE user_id = $1',
      [request.member.id],
    );
    const completionResult = await client.query(
      'SELECT skill_id AS "skillId" FROM user_skill_completions WHERE user_id = $1 ORDER BY skill_id',
      [request.member.id],
    );
    const catalogResult = await client.query(
      'SELECT COALESCE(MAX(catalog_version), 1)::int AS version FROM skills WHERE active = true',
    );
    await client.query('COMMIT');
    sendSuccess(response, {
      catalogVersion: catalogResult.rows[0].version,
      revision: revisionResult.rows[0]?.revision ?? '0',
      completedSkillIds: completionResult.rows.map((row) => row.skillId),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});
