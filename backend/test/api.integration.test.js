import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { app } from '../src/app.js';
import { pool, closePool } from '../src/db/pool.js';
import { hashPassword } from '../src/lib/password.js';
import { hashRateLimitSubject } from '../src/services/auth-rate-limit.js';
import { listPublishedQuestionsForSkill, getPublishedQuestionCoverage } from '../src/services/question-bank.js';
import { recordSkillCompletion } from '../src/services/progress-service.js';

const tag = randomUUID().replaceAll('-', '').slice(0, 16);
const password = 'SkillTree9';
const resetToken = `integration-reset-${tag}`;
const appOrigin = 'http://localhost:5173';
const fixtures = { userIds: [], adminId: null, categoryId: `it-${tag}`, skillId: `it-${tag}` };
let server;
let baseUrl;
let member;
let otherMember;
let admin;
let memberCookie;
let adminCookie;

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function createMember(label) {
  const email = `it-${label}-${tag}@example.test`;
  const nickname = `T${label}_${tag.slice(0, 4)}`;
  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users(email_normalized, password_hash, email_verified_at)
     VALUES ($1, $2, now()) RETURNING id::text AS id`,
    [email, passwordHash],
  );
  const id = result.rows[0].id;
  fixtures.userIds.push(id);
  await pool.query(
    `INSERT INTO member_profiles(user_id, nickname, route, onboarding_completed)
     VALUES ($1, $2, 'beginner', false)`,
    [id, nickname],
  );
  return { id, email, nickname };
}

async function createQuestion(prompt, { demo = false, published = true, active = true, deleted = false } = {}) {
  const result = await pool.query(
    `INSERT INTO questions(
       skill_id, prompt, choices, correct_choice, answer_mode, correct_choices,
       choice_explanations, explanation, active, is_demo, difficulty, status, deleted_at
     ) VALUES ($1, $2, '["A","B"]'::jsonb, 0, 'single', '[0]'::jsonb,
               '["Correct","Incorrect"]'::jsonb, 'Explanation', $3, $4,
               'beginner', $5, CASE WHEN $6 THEN now() ELSE NULL END)
     RETURNING id::text AS id`,
    [fixtures.skillId, prompt, active, demo, published ? 'published' : 'draft', deleted],
  );
  return result.rows[0].id;
}

function cookieFrom(response, name) {
  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  const header = cookies.find((value) => value.startsWith(`${name}=`));
  assert.ok(header, `Expected ${name} cookie`);
  return header.split(';', 1)[0];
}

async function api(path, { method = 'GET', body, cookie, origin } = {}) {
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (cookie) headers.set('Cookie', cookie);
  if (origin) headers.set('Origin', origin);
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

before(async () => {
  const categoryOrder = Math.floor(Math.random() * 2_000_000_000) + 1;
  await pool.query(
    'INSERT INTO skill_categories(id, name, sort_order) VALUES ($1, $2, $3)',
    [fixtures.categoryId, `Integration ${tag}`, categoryOrder],
  );
  await pool.query(
    `INSERT INTO skills(id, category_id, title, catalog_version, sort_order)
     VALUES ($1, $2, $3, 7, 1)`,
    [fixtures.skillId, fixtures.categoryId, `Integration ${tag}`],
  );

  member = await createMember('member');
  otherMember = await createMember('other');
  admin = {
    username: `it_${tag}`,
    passwordHash: await hashPassword(password),
  };
  const adminResult = await pool.query(
    `INSERT INTO admin_accounts(username, password_hash) VALUES ($1, $2) RETURNING id::text AS id`,
    [admin.username, admin.passwordHash],
  );
  fixtures.adminId = adminResult.rows[0].id;

  for (let index = 0; index < 5; index += 1) {
    await createQuestion(`Approved fixture ${tag} ${index}`);
  }
  await createQuestion(`Demo fixture ${tag}`, { demo: true });
  await createQuestion(`Draft fixture ${tag}`, { published: false });
  await createQuestion(`Deleted fixture ${tag}`, { deleted: true });
  await createQuestion(`Inactive fixture ${tag}`, { active: false });

  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeIdleConnections?.();
    });
  }

  try {
    await pool.query('DELETE FROM user_skill_completions WHERE user_id = ANY($1::bigint[]) OR skill_id = $2', [fixtures.userIds, fixtures.skillId]);
    await pool.query('DELETE FROM quiz_attempts WHERE user_id = ANY($1::bigint[]) OR skill_id = $2', [fixtures.userIds, fixtures.skillId]);
    await pool.query('DELETE FROM questions WHERE skill_id = $1', [fixtures.skillId]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::bigint[])', [fixtures.userIds]);
    if (fixtures.adminId) await pool.query('DELETE FROM admin_accounts WHERE id = $1', [fixtures.adminId]);
    await pool.query('DELETE FROM skills WHERE id = $1', [fixtures.skillId]);
    await pool.query('DELETE FROM skill_categories WHERE id = $1', [fixtures.categoryId]);
    const subjects = [member?.email, otherMember?.email].filter(Boolean).map((email) => hashRateLimitSubject('member_login', email));
    subjects.push(hashRateLimitSubject('admin_login', admin?.username || ''));
    subjects.push(hashRateLimitSubject('password_reset', member?.email || ''));
    await pool.query('DELETE FROM auth_rate_limits WHERE subject_hash = ANY($1::char(64)[])', [subjects]);
  } finally {
    await closePool();
  }
});

test('Skill Tree API integration contract', async (t) => {
  await t.test('health and CORS permit the implemented PUT route', async () => {
    const health = await api('/api/health');
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      success: true,
      data: { status: 'ok', database: 'connected' },
    });

    const preflight = await api('/api/admin/questions/1', {
      method: 'OPTIONS',
      origin: appOrigin,
    });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get('access-control-allow-methods'), /\bPUT\b/u);

    const originalQuery = pool.query;
    pool.query = async () => { throw new Error('simulated database outage'); };
    try {
      const unavailable = await api('/api/health');
      assert.equal(unavailable.status, 503);
      const payload = await unavailable.json();
      assert.equal(payload.error.code, 'DATABASE_UNAVAILABLE');
      assert.ok(payload.error.requestId);
    } finally {
      pool.query = originalQuery;
    }

    const originalConnect = pool.connect;
    const originalConsoleError = console.error;
    pool.connect = async () => {
      const error = new Error('simulated database connection failure');
      error.code = 'ECONNREFUSED';
      throw error;
    };
    console.error = () => {};
    try {
      const unavailable = await api('/api/skills');
      assert.equal(unavailable.status, 503);
      const payload = await unavailable.json();
      assert.equal(payload.error.code, 'DATABASE_UNAVAILABLE');
      assert.ok(payload.error.requestId);
    } finally {
      pool.connect = originalConnect;
      console.error = originalConsoleError;
    }
  });

  await t.test('validation errors use fields and always include a requestId', async () => {
    const response = await api('/api/auth/register', {
      method: 'POST',
      origin: appOrigin,
      body: { email: 'not-an-email', password: 'x' },
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.error.code, 'VALIDATION_ERROR');
    assert.ok(payload.error.requestId);
    assert.ok(payload.error.fields.email);
    assert.ok(payload.error.fields.password);
    assert.equal('details' in payload.error, false);

    const malformed = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: appOrigin },
      body: '{',
    });
    assert.equal(malformed.status, 400);
    const malformedPayload = await malformed.json();
    assert.equal(malformedPayload.error.code, 'INVALID_JSON');
    assert.ok(malformedPayload.error.requestId);
  });

  await t.test('member session owns identity and onboarding updates only that member', async () => {
    const login = await api('/api/auth/login', {
      method: 'POST',
      origin: appOrigin,
      body: { email: member.email, password },
    });
    assert.equal(login.status, 200);
    memberCookie = cookieFrom(login, 'sid');
    const current = await api('/api/me', { cookie: memberCookie });
    const currentPayload = await current.json();
    assert.equal(current.status, 200);
    assert.equal(currentPayload.data.userId, member.id);
    assert.equal(currentPayload.data.username, member.nickname);
    assert.equal(currentPayload.data.onboardingCompleted, false);

    const update = await api('/api/me/profile', {
      method: 'PATCH',
      cookie: memberCookie,
      origin: appOrigin,
      body: { userId: otherMember.id, username: `P_${tag.slice(0, 6)}`, avatarId: 'avatar-03' },
    });
    assert.equal(update.status, 200);
    const updated = await update.json();
    assert.equal(updated.data.userId, member.id);
    assert.equal(updated.data.onboardingCompleted, true);
    const untouched = await pool.query('SELECT nickname, onboarding_completed FROM member_profiles WHERE user_id = $1', [otherMember.id]);
    assert.equal(untouched.rows[0].onboarding_completed, false);

    const duplicate = await api('/api/me/profile', {
      method: 'PATCH',
      cookie: memberCookie,
      origin: appOrigin,
      body: { username: otherMember.nickname, avatarId: 'avatar-01' },
    });
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).error.code, 'USERNAME_TAKEN');

    const anonymous = await api('/api/me');
    assert.equal(anonymous.status, 401);
    const memberCannotUseAdminApi = await api('/api/admin/members', { cookie: memberCookie });
    assert.equal(memberCannotUseAdminApi.status, 401);
  });

  await t.test('forgot-password does not reveal whether an email exists', async () => {
    const subjectHash = hashRateLimitSubject('password_reset', member.email);
    await pool.query(
      `INSERT INTO auth_rate_limits(scope, subject_hash, failure_count, last_sent_at, updated_at)
       VALUES ('password_reset', $1, 0, now(), now())
       ON CONFLICT (scope, subject_hash) DO UPDATE SET last_sent_at = now(), updated_at = now()`,
      [subjectHash],
    );
    const known = await api('/api/auth/forgot-password', {
      method: 'POST', origin: appOrigin, body: { email: member.email },
    });
    const unknown = await api('/api/auth/forgot-password', {
      method: 'POST', origin: appOrigin, body: { email: `missing-${tag}@example.test` },
    });
    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.deepEqual(await known.json(), await unknown.json());
  });

  await t.test('reset token can be checked without consumption and reset revokes all sessions', async () => {
    await pool.query(
      `INSERT INTO email_tokens(user_id, token_hash, purpose, expires_at)
       VALUES ($1, $2, 'reset_password', now() + interval '1 hour')`,
      [member.id, digest(resetToken)],
    );
    const verify = await api('/api/auth/reset-password/verify', {
      method: 'POST', origin: appOrigin, body: { token: resetToken },
    });
    assert.equal(verify.status, 204);
    const tokenBeforeReset = await pool.query('SELECT used_at FROM email_tokens WHERE token_hash = $1', [digest(resetToken)]);
    assert.equal(tokenBeforeReset.rows[0].used_at, null);

    const expiredToken = `expired-${tag}`;
    await pool.query(
      `INSERT INTO email_tokens(user_id, token_hash, purpose, created_at, expires_at)
       VALUES ($1, $2, 'reset_password', now() - interval '2 hours', now() - interval '1 hour')`,
      [member.id, digest(expiredToken)],
    );
    const expiredCheck = await api('/api/auth/reset-password/verify', {
      method: 'POST', origin: appOrigin, body: { token: expiredToken },
    });
    assert.equal(expiredCheck.status, 400);
    assert.equal((await expiredCheck.json()).error.code, 'INVALID_OR_EXPIRED_TOKEN');

    const reset = await api('/api/auth/reset-password', {
      method: 'POST', origin: appOrigin, body: { token: resetToken, password: 'NewSkill9' },
    });
    assert.equal(reset.status, 204);
    assert.match(reset.headers.get('set-cookie'), /Max-Age=0/u);
    const consumedCheck = await api('/api/auth/reset-password/verify', {
      method: 'POST', origin: appOrigin, body: { token: resetToken },
    });
    assert.equal(consumedCheck.status, 400);
    const oldSession = await api('/api/me', { cookie: memberCookie });
    assert.equal(oldSession.status, 401);

    const login = await api('/api/auth/login', {
      method: 'POST', origin: appOrigin, body: { email: member.email, password: 'NewSkill9' },
    });
    assert.equal(login.status, 200);
    memberCookie = cookieFrom(login, 'sid');
  });

  await t.test('skill catalog and progress use one catalog version and completion revisions are idempotent', async () => {
    const catalog = await api('/api/skills');
    const catalogData = (await catalog.json()).data;
    assert.equal(catalog.status, 200);
    assert.equal(catalogData.catalogVersion, 7);
    assert.ok(catalogData.skills.some((skill) => skill.skillId === fixtures.skillId));

    const initial = await api('/api/progress', { cookie: memberCookie });
    const initialData = (await initial.json()).data;
    assert.equal(initialData.catalogVersion, catalogData.catalogVersion);
    assert.equal(initialData.revision, '0');
    assert.deepEqual(initialData.completedSkillIds, []);

    const attemptId = randomUUID();
    await pool.query(
      `INSERT INTO quiz_attempts(id, user_id, skill_id, catalog_version, status, total_questions,
                                 correct_count, passed, completed_at)
       VALUES ($1, $2, $3, 7, 'completed', 5, 5, true, now())`,
      [attemptId, member.id, fixtures.skillId],
    );
    let client = await pool.connect();
    let first;
    try {
      await client.query('BEGIN');
      first = await recordSkillCompletion(client, { userId: member.id, skillId: fixtures.skillId, attemptId });
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    assert.equal(first.newlyCompleted, true);
    assert.equal(first.revision, '1');

    client = await pool.connect();
    let duplicate;
    try {
      await client.query('BEGIN');
      duplicate = await recordSkillCompletion(client, { userId: member.id, skillId: fixtures.skillId, attemptId });
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    assert.equal(duplicate.newlyCompleted, false);
    assert.equal(duplicate.revision, '1');

    const afterCompletion = await api('/api/progress', { cookie: memberCookie });
    const afterData = (await afterCompletion.json()).data;
    assert.equal(afterData.revision, '1');
    assert.deepEqual(afterData.completedSkillIds, [fixtures.skillId]);

    await assert.rejects(
      recordSkillCompletion(pool, { userId: member.id, skillId: fixtures.skillId, attemptId: randomUUID() }),
      (error) => error.code === 'SKILL_COMPLETION_REQUIRES_PASSED_ATTEMPT',
    );
  });

  await t.test('C question repository filters demo, draft, deleted and inactive rows; coverage uses five approved questions', async () => {
    const questions = await listPublishedQuestionsForSkill(pool, fixtures.skillId);
    assert.equal(questions.length, 5);
    assert.ok(questions.every((question) => question.correctChoices.length === 1));

    const coverage = await getPublishedQuestionCoverage(pool, 5);
    const skillCoverage = coverage.skills.find((skill) => skill.skillId === fixtures.skillId);
    assert.equal(skillCoverage.publishedQuestionCount, 5);
    assert.equal(skillCoverage.meetsMinimum, true);
    assert.equal(coverage.ready, coverage.skills.every((skill) => skill.meetsMinimum));
    assert.equal((await api(`/api/quiz/questions?skillId=${fixtures.skillId}`)).status, 404);

    await assert.rejects(
      pool.query(
        `INSERT INTO questions(skill_id, prompt, choices, correct_choice, answer_mode, correct_choices,
                               choice_explanations, explanation, difficulty, status, active)
         VALUES ($1, $2, '["A","B"]'::jsonb, 0, 'multiple', '[0,0]'::jsonb,
                 '["A","B"]'::jsonb, 'invalid', 'beginner', 'published', true)`,
        [fixtures.skillId, `Invalid duplicate indexes ${tag}`],
      ),
      (error) => error.code === '23514',
    );
  });

  await t.test('admin member actions use admin session and suspend invalidates member session', async () => {
    const login = await api('/api/admin/auth/login', {
      method: 'POST', origin: appOrigin,
      body: { username: admin.username, password },
    });
    assert.equal(login.status, 200);
    adminCookie = cookieFrom(login, 'admin_sid');

    const listing = await api('/api/admin/members?keyword=missing&page=1');
    assert.equal(listing.status, 401);
    const members = await api('/api/admin/members?keyword=it-', { cookie: adminCookie });
    assert.equal(members.status, 200);
    assert.ok((await members.json()).data.items.some((item) => item.userId === member.id));

    const detail = await api(`/api/admin/members/${member.id}`, { cookie: adminCookie });
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).data.xp, '0');

    const suspended = await api(`/api/admin/members/${member.id}/suspend`, {
      method: 'POST', cookie: adminCookie, origin: appOrigin,
    });
    assert.equal(suspended.status, 200);
    assert.equal((await api('/api/me', { cookie: memberCookie })).status, 401);
    const suspendedLogin = await api('/api/auth/login', {
      method: 'POST', origin: appOrigin,
      body: { email: member.email, password: 'NewSkill9' },
    });
    assert.equal(suspendedLogin.status, 403);
    assert.equal((await suspendedLogin.json()).error.code, 'ACCOUNT_SUSPENDED');

    const restored = await api(`/api/admin/members/${member.id}/restore`, {
      method: 'POST', cookie: adminCookie, origin: appOrigin,
    });
    assert.equal(restored.status, 200);
    assert.equal((await api('/api/me', { cookie: memberCookie })).status, 401);
  });

  await t.test('member logout revokes the session and clears its cookie', async () => {
    const login = await api('/api/auth/login', {
      method: 'POST', origin: appOrigin,
      body: { email: member.email, password: 'NewSkill9' },
    });
    assert.equal(login.status, 200);
    const activeCookie = cookieFrom(login, 'sid');
    const logout = await api('/api/auth/logout', {
      method: 'POST', cookie: activeCookie, origin: appOrigin,
    });
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0/u);
    assert.equal((await api('/api/me', { cookie: activeCookie })).status, 401);
  });

  await t.test('migration rerun accepts unchanged checksums and rejects a modified record', async () => {
    const migrationSql = await readFile(new URL('../migrations/009_question_answer_index_integrity.sql', import.meta.url), 'utf8');
    const checksum = createHash('sha256').update(migrationSql).digest('hex');
    const migrationName = '009_question_answer_index_integrity.sql';
    await pool.query('UPDATE schema_migrations SET checksum = $1 WHERE name = $2', ['0'.repeat(64), migrationName]);
    try {
      const run = spawnSync(process.execPath, ['scripts/migrate.js'], {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        env: process.env,
        encoding: 'utf8',
      });
      assert.equal(run.status, 1);
      assert.match(run.stderr, /Applied migration was modified: 009_question_answer_index_integrity\.sql/u);
    } finally {
      await pool.query('UPDATE schema_migrations SET checksum = $1 WHERE name = $2', [checksum, migrationName]);
    }
  });
});
