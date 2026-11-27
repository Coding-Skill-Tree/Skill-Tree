import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireMember } from '../middleware/require-member.js';
import { sendSuccess } from '../lib/api-response.js';
import { validationError } from '../lib/http-error.js';
import { readActiveCatalogVersion } from '../services/progress-service.js';

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 50;
const HISTORY_CURSOR_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const HISTORY_CURSOR_TIMESTAMP = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{6}Z$/u;

function isValidHistoryCursorTimestamp(value) {
  if (!HISTORY_CURSOR_TIMESTAMP.test(value) || value.startsWith('0000')) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    && new Date(timestamp).toISOString().slice(0, 19) === value.slice(0, 19);
}

function readHistoryLimit(value) {
  if (value === undefined) return DEFAULT_HISTORY_LIMIT;
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/u.test(value)) {
    throw validationError({ limit: '必須是 1 到 ' + MAX_HISTORY_LIMIT + ' 的整數' });
  }
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit > MAX_HISTORY_LIMIT) {
    throw validationError({ limit: '必須是 1 到 ' + MAX_HISTORY_LIMIT + ' 的整數' });
  }
  return limit;
}

function readHistoryCursor(value) {
  if (value === undefined) return null;
  if (typeof value !== 'string' || value.length > 256 || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw validationError({ cursor: '分頁游標格式無效' });
  }

  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    if (Buffer.from(decoded, 'utf8').toString('base64url') !== value) {
      throw new Error('Non-canonical cursor');
    }
    const cursor = JSON.parse(decoded);
    if (
      typeof cursor.completedAt !== 'string'
      || !isValidHistoryCursorTimestamp(cursor.completedAt)
      || typeof cursor.activityId !== 'string'
      || !HISTORY_CURSOR_UUID.test(cursor.activityId)
    ) {
      throw new Error('Invalid cursor fields');
    }
    return { completedAt: cursor.completedAt, activityId: cursor.activityId };
  } catch {
    throw validationError({ cursor: '分頁游標格式無效' });
  }
}

function encodeHistoryCursor(item) {
  return Buffer.from(JSON.stringify({
    completedAt: item.completedAtCursor,
    activityId: item.activityId,
  }), 'utf8').toString('base64url');
}

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
    const catalogVersion = await readActiveCatalogVersion(client);
    await client.query('COMMIT');
    sendSuccess(response, {
      catalogVersion,
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

progressRouter.get('/progress/history', requireMember, async (request, response, next) => {
  try {
    const limit = readHistoryLimit(request.query.limit);
    const cursor = readHistoryCursor(request.query.cursor);
    const result = await pool.query(
      `SELECT activity_id::text AS "activityId", activity_type AS "activityType",
              skill_id AS "skillId", title AS "skillTitle", catalog_version AS "catalogVersion",
              correct_count AS "correctCount", total_questions AS "totalQuestions",
              passed, completed_at AS "completedAt",
              to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "completedAtCursor"
       FROM user_learning_activity_history
       WHERE user_id = $1
         AND ($2::timestamptz IS NULL OR (completed_at, activity_id) < ($2::timestamptz, $3::uuid))
       ORDER BY completed_at DESC, activity_id DESC
       LIMIT $4`,
      [request.member.id, cursor?.completedAt ?? null, cursor?.activityId ?? null, limit + 1],
    );
    const hasMore = result.rows.length > limit;
    const rows = result.rows.slice(0, limit);
    const items = rows.map((row) => ({
      activityId: row.activityId,
      activityType: row.activityType,
      skillId: row.skillId,
      skillTitle: row.skillTitle,
      catalogVersion: row.catalogVersion,
      completedAt: row.completedAt.toISOString(),
      result: {
        correctCount: row.correctCount,
        totalQuestions: row.totalQuestions,
        passed: row.passed,
      },
    }));
    sendSuccess(response, {
      items,
      nextCursor: hasMore ? encodeHistoryCursor(rows[rows.length - 1]) : null,
    });
  } catch (error) {
    next(error);
  }
});
