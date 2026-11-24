import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { HttpError, validationError } from '../lib/http-error.js';
import { sendSuccess } from '../lib/api-response.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { validateLogin } from '../lib/validation.js';
import { assertLoginNotBlocked, clearLoginFailures, hashRateLimitSubject, recordLoginFailure } from '../services/auth-rate-limit.js';
import { createAdminSession, revokeAdminSession } from '../services/session-service.js';

export const adminRouter = Router();

let dummyPasswordHashPromise;
function dummyPasswordHash() {
  dummyPasswordHashPromise ||= hashPassword(randomBytes(32).toString('hex'));
  return dummyPasswordHashPromise;
}

adminRouter.post('/auth/login', async (request, response, next) => {
  const username = typeof request.body?.username === 'string' ? request.body.username.trim().toLowerCase() : '';
  const password = request.body?.password;
  try {
    validateLogin(username, password, true);
    const subjectHash = hashRateLimitSubject('admin_login', username);
    await assertLoginNotBlocked('admin_login', subjectHash);
    const result = await pool.query(
      'SELECT id, username, password_hash AS "passwordHash", disabled_at AS "disabledAt" FROM admin_accounts WHERE username = $1',
      [username],
    );
    const admin = result.rows[0];
    const passwordMatches = await verifyPassword(password, admin?.passwordHash || await dummyPasswordHash());
    if (!admin || admin.disabledAt || !passwordMatches) {
      await recordLoginFailure('admin_login', subjectHash);
      throw new HttpError(401, 'INVALID_CREDENTIALS', '管理員帳號或密碼錯誤');
    }

    await clearLoginFailures('admin_login', subjectHash);
    await createAdminSession(admin.id, response);
    sendSuccess(response, { id: String(admin.id), adminId: String(admin.id), username: admin.username });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/me', requireAdmin, (request, response) => {
  sendSuccess(response, { id: String(request.admin.id), adminId: String(request.admin.id), username: request.admin.username });
});

adminRouter.post('/auth/logout', async (request, response, next) => {
  try {
    await revokeAdminSession(request, response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

adminRouter.use(requireAdmin);

const MEMBERS_PAGE_SIZE = 20;
const MAX_BIGINT = 9223372036854775807n;

function memberNotFound() {
  return new HttpError(404, 'MEMBER_NOT_FOUND', '找不到這位會員');
}

function parseMemberId(value) {
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/u.test(value)) throw memberNotFound();
  try {
    if (BigInt(value) > MAX_BIGINT) throw memberNotFound();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw memberNotFound();
  }
  return value;
}

function parseMembersQuery(query) {
  if (query.keyword !== undefined && typeof query.keyword !== 'string') {
    throw validationError({ keyword: '關鍵字格式錯誤' });
  }
  const rawKeyword = typeof query.keyword === 'string' ? query.keyword.trim() : '';
  if (Array.from(rawKeyword).length > 100) {
    throw validationError({ keyword: '關鍵字最多 100 個字' });
  }

  const rawPage = query.page === undefined ? '1' : String(query.page);
  if (!/^\d+$/u.test(rawPage) || !Number.isSafeInteger(Number(rawPage)) || Number(rawPage) < 1) {
    throw validationError({ page: '頁碼必須是正整數' });
  }
  return { keyword: rawKeyword, page: Number(rawPage) };
}

async function readMemberDetails(database, memberId) {
  const result = await database.query(
    `SELECT u.id::text AS id, p.nickname, p.avatar_id AS "avatarId", p.role, p.level,
            u.email_normalized AS email,
            u.created_at AS "createdAt", p.route AS "learningRoute",
            p.onboarding_completed AS "onboardingCompleted",
            EXISTS (
              SELECT 1 FROM member_auth_identities identity
              WHERE identity.user_id = u.id AND identity.provider = 'google'
            ) AS "googleLinked",
            (u.suspended_at IS NOT NULL) AS suspended,
            u.suspended_at AS "suspendedAt"
     FROM users u
     LEFT JOIN member_profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [memberId],
  );
  const member = result.rows[0];
  if (!member) throw memberNotFound();
  const xpResult = await database.query(
    'SELECT COALESCE(SUM(amount), 0)::text AS xp FROM xp_ledger WHERE user_id = $1',
    [member.id],
  );
  const progressResult = await database.query(
    `SELECT c.name AS "courseName", COUNT(DISTINCT s.id)::int AS "totalLevels",
            COUNT(DISTINCT completion.skill_id)::int AS "currentLevel"
     FROM skill_categories c
     JOIN skills s ON s.category_id = c.id AND s.active = true
     LEFT JOIN user_skill_completions completion
       ON completion.skill_id = s.id AND completion.user_id = $1
     WHERE c.active = true
     GROUP BY c.id, c.name, c.sort_order
     ORDER BY c.sort_order, c.name`,
    [member.id],
  );
  const xp = Number(xpResult.rows[0]?.xp ?? 0);
  return {
    id: member.id,
    userId: member.id,
    role: member.role,
    username: member.nickname,
    nickname: member.nickname,
    avatarId: member.avatarId,
    email: member.email,
    createdAt: new Date(member.createdAt).toISOString(),
    learningRoute: member.learningRoute,
    onboardingCompleted: member.onboardingCompleted,
    googleLinked: member.googleLinked,
    suspended: member.suspended,
    suspendedAt: member.suspendedAt ? new Date(member.suspendedAt).toISOString() : null,
    xp: Number.isSafeInteger(xp) ? xp : null,
    level: member.level,
    courseProgress: progressResult.rows,
  };
}

adminRouter.get('/members', async (request, response, next) => {
  const client = await pool.connect();
  try {
    const { keyword, page } = parseMembersQuery(request.query);
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const countResult = await client.query(
      `SELECT count(*)::int AS total
       FROM users u LEFT JOIN member_profiles p ON p.user_id = u.id
       WHERE $1 = ''
          OR strpos(lower(COALESCE(p.nickname, '')), lower($1)) > 0
          OR strpos(lower(u.email_normalized), lower($1)) > 0`,
      [keyword],
    );
    const total = countResult.rows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE));
    const offset = (BigInt(page) - 1n) * BigInt(MEMBERS_PAGE_SIZE);
    const memberResult = await client.query(
      `SELECT u.id::text AS id, p.nickname, p.avatar_id AS "avatarId", u.email_normalized AS email,
              u.created_at AS "createdAt", (u.suspended_at IS NOT NULL) AS suspended
       FROM users u LEFT JOIN member_profiles p ON p.user_id = u.id
       WHERE $1 = ''
          OR strpos(lower(COALESCE(p.nickname, '')), lower($1)) > 0
          OR strpos(lower(u.email_normalized), lower($1)) > 0
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT $2 OFFSET $3`,
      [keyword, MEMBERS_PAGE_SIZE, offset.toString()],
    );
    await client.query('COMMIT');
    sendSuccess(response, {
      items: memberResult.rows.map((member) => ({
        id: member.id,
        userId: member.id,
        nickname: member.nickname,
        username: member.nickname,
        avatarId: member.avatarId,
        email: member.email,
        createdAt: new Date(member.createdAt).toISOString(),
        suspended: member.suspended,
      })),
      page,
      pageSize: MEMBERS_PAGE_SIZE,
      total,
      totalPages,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

adminRouter.get('/members/:id', async (request, response, next) => {
  try {
    const member = await readMemberDetails(pool, parseMemberId(request.params.id));
    sendSuccess(response, member);
  } catch (error) {
    next(error);
  }
});

async function setMemberSuspension(request, response, next, suspend) {
  const memberId = parseMemberId(request.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT suspended_at AS "suspendedAt" FROM users WHERE id = $1 FOR UPDATE', [memberId]);
    if (!current.rows[0]) throw memberNotFound();

    const currentlySuspended = Boolean(current.rows[0].suspendedAt);
    if (suspend && !currentlySuspended) {
      await client.query('UPDATE users SET suspended_at = now(), updated_at = now() WHERE id = $1', [memberId]);
      await client.query('DELETE FROM member_sessions WHERE user_id = $1', [memberId]);
      await client.query(
        `INSERT INTO admin_audit_log(admin_id, action, target_type, target_id)
         VALUES ($1, 'member.suspend', 'member', $2)`,
        [request.admin.id, memberId],
      );
    } else if (!suspend && currentlySuspended) {
      await client.query('UPDATE users SET suspended_at = NULL, updated_at = now() WHERE id = $1', [memberId]);
      await client.query(
        `INSERT INTO admin_audit_log(admin_id, action, target_type, target_id)
         VALUES ($1, 'member.restore', 'member', $2)`,
        [request.admin.id, memberId],
      );
    }

    const member = await readMemberDetails(client, memberId);
    await client.query('COMMIT');
    sendSuccess(response, member);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}

adminRouter.post('/members/:id/suspend', (request, response, next) => setMemberSuspension(request, response, next, true));
adminRouter.post('/members/:id/restore', (request, response, next) => setMemberSuspension(request, response, next, false));
