import { Router } from 'express';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { pool } from '../db/pool.js';
import { requireMember } from '../middleware/require-member.js';
import { HttpError, validationError } from '../lib/http-error.js';
import { sendSuccess } from '../lib/api-response.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { isValidEmail, normalizeEmail, validateLogin, validateMemberProfile, validateNewPassword, validateRegistration } from '../lib/validation.js';
import { assertLoginNotBlocked, clearLoginFailures, hashRateLimitSubject, recordLoginFailure } from '../services/auth-rate-limit.js';
import { sendPasswordResetCodeEmail, sendWelcomeEmail } from '../services/email-service.js';
import { digestEmailCode, EMAIL_CODE_MAX_ATTEMPTS, EMAIL_CODE_TTL_MINUTES, generateEmailCode } from '../services/email-code.js';
import { clearMemberSessionCookie, createMemberSession, createMemberSessionRecord, revokeMemberSession } from '../services/session-service.js';

export const authRouter = Router();

let dummyPasswordHashPromise;
function dummyPasswordHash() {
  dummyPasswordHashPromise ||= hashPassword(randomBytes(32).toString('hex'));
  return dummyPasswordHashPromise;
}

function memberPayload(member) {
  return {
    userId: String(member.id),
    email: member.email,
    createdAt: new Date(member.createdAt).toISOString(),
    username: member.nickname,
    avatarId: member.avatarId,
    route: member.route,
    onboardingCompleted: member.onboardingCompleted,
    hasPassword: member.hasPassword,
  };
}

function tokenDigest(token) {
  return createHash('sha256').update(token).digest('hex');
}

const INVALID_RESET_CODE = () => new HttpError(400, 'INVALID_OR_EXPIRED_CODE', '驗證碼無效、已過期或已達輸入次數上限');

async function lockResetCode(client, email, code) {
  const result = await client.query(
    `SELECT et.id, et.user_id AS "userId", et.token_hash AS "tokenHash",
            et.attempt_count AS "attemptCount"
     FROM users u JOIN email_tokens et ON et.user_id = u.id
     WHERE u.email_normalized = $1 AND et.purpose = 'reset_password'
       AND et.used_at IS NULL AND et.expires_at > now()
     ORDER BY et.created_at DESC
     LIMIT 1 FOR UPDATE OF et`,
    [email],
  );
  const resetCode = result.rows[0];
  if (!resetCode || resetCode.attemptCount >= EMAIL_CODE_MAX_ATTEMPTS) return null;

  const actual = Buffer.from(resetCode.tokenHash, 'hex');
  const expected = Buffer.from(digestEmailCode(resetCode.userId, code), 'hex');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    await client.query('UPDATE email_tokens SET attempt_count = attempt_count + 1 WHERE id = $1', [resetCode.id]);
    return null;
  }
  return resetCode;
}

authRouter.post('/auth/register', async (request, response, next) => {
  const email = normalizeEmail(request.body?.email);
  const password = request.body?.password;
  try {
    validateRegistration(email, password);
    const passwordHash = await hashPassword(password);
    const client = await pool.connect();
    let userId;
    let member;
    let session;
    try {
      await client.query('BEGIN');
      const userResult = await client.query(
        `INSERT INTO users(email_normalized, password_hash, email_verified_at)
         VALUES ($1, $2, now())
         RETURNING id, email_normalized AS email, created_at AS "createdAt"`,
        [email, passwordHash],
      );
      member = userResult.rows[0];
      userId = member.id;
      await client.query('INSERT INTO member_profiles(user_id) VALUES ($1)', [userId]);
      session = await createMemberSessionRecord(client, userId);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      if (error.code === '23505') {
        return next(new HttpError(409, 'EMAIL_TAKEN', '此 Email 已註冊'));
      }
      return next(error);
    } finally {
      client.release();
    }

    session.attachCookie(response);
    try {
      await sendWelcomeEmail({ to: email });
    } catch (error) {
      console.error('Welcome email delivery failed', {
        requestId: response.locals.requestId,
        message: error.message,
      });
    }
    sendSuccess(response, {
      ...memberPayload({
        ...member,
        nickname: null,
        avatarId: null,
        route: null,
        onboardingCompleted: false,
        hasPassword: true,
      }),
      nextStep: '/onboarding',
    }, 201);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/auth/verify-email', async (request, response, next) => {
  const token = typeof request.body?.token === 'string' ? request.body.token : '';
  if (!token || token.length > 256) {
    return next(new HttpError(400, 'INVALID_OR_EXPIRED_TOKEN', '驗證連結無效或已過期'));
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tokenResult = await client.query(
      `SELECT id, user_id FROM email_tokens
       WHERE token_hash = $1 AND purpose = 'verify_email' AND used_at IS NULL AND expires_at > now()
       FOR UPDATE`,
      [tokenDigest(token)],
    );
    if (!tokenResult.rows[0]) throw new HttpError(400, 'INVALID_OR_EXPIRED_TOKEN', '驗證連結無效或已過期');

    const verification = tokenResult.rows[0];
    await client.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()), updated_at = now() WHERE id = $1', [verification.user_id]);
    await client.query('UPDATE email_tokens SET used_at = now() WHERE id = $1', [verification.id]);
    await client.query('COMMIT');
    sendSuccess(response, { emailVerified: true });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

authRouter.post('/auth/login', async (request, response, next) => {
  const email = normalizeEmail(request.body?.email);
  const password = request.body?.password;
  try {
    validateLogin(email, password);
    const subjectHash = hashRateLimitSubject('member_login', email);
    await assertLoginNotBlocked('member_login', subjectHash);
    const result = await pool.query(
      `SELECT u.id, u.email_normalized AS email, u.password_hash AS "passwordHash",
              u.email_verified_at AS "emailVerifiedAt", u.suspended_at AS "suspendedAt",
              u.created_at AS "createdAt", p.nickname, p.avatar_id AS "avatarId", p.route,
              p.onboarding_completed AS "onboardingCompleted", u.password_hash IS NOT NULL AS "hasPassword"
       FROM users u LEFT JOIN member_profiles p ON p.user_id = u.id
       WHERE u.email_normalized = $1`,
      [email],
    );
    const member = result.rows[0];
    const passwordMatches = await verifyPassword(password, member?.passwordHash || await dummyPasswordHash());
    if (!member || !member.hasPassword || !passwordMatches) {
      await recordLoginFailure('member_login', subjectHash);
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email 或密碼錯誤');
    }

    if (member.suspendedAt) {
      await clearLoginFailures('member_login', subjectHash);
      throw new HttpError(403, 'ACCOUNT_SUSPENDED', '此帳號已被停權');
    }
    if (!member.emailVerifiedAt) {
      await recordLoginFailure('member_login', subjectHash);
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email 或密碼錯誤');
    }

    await clearLoginFailures('member_login', subjectHash);
    await createMemberSession(member.id, response);
    sendSuccess(response, memberPayload(member));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/auth/forgot-password', async (request, response, next) => {
  const email = normalizeEmail(request.body?.email);
  const genericMessage = '若此 Email 已註冊，我們已寄出密碼重設驗證碼';
  if (!isValidEmail(email)) {
    return next(validationError({ email: '請輸入有效的 Email' }));
  }

  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email_normalized = $1', [email]);
    if (userResult.rows[0]) {
      const subjectHash = hashRateLimitSubject('password_reset', email);
      const resetCode = generateEmailCode();
      const client = await pool.connect();
      let shouldSend = false;
      try {
        await client.query('BEGIN');
        const throttle = await client.query(
          `INSERT INTO auth_rate_limits(scope, subject_hash, failure_count, last_sent_at, updated_at)
           VALUES ('password_reset', $1, 0, now(), now())
           ON CONFLICT (scope, subject_hash) DO UPDATE SET last_sent_at = now(), updated_at = now()
           WHERE auth_rate_limits.last_sent_at IS NULL
              OR auth_rate_limits.last_sent_at <= now() - interval '60 seconds'
           RETURNING scope`,
          [subjectHash],
        );
        shouldSend = throttle.rowCount === 1;
        if (shouldSend) {
          await client.query(
            `UPDATE email_tokens SET used_at = now()
             WHERE user_id = $1 AND purpose = 'reset_password' AND used_at IS NULL`,
            [userResult.rows[0].id],
          );
          await client.query(
            `INSERT INTO email_tokens(user_id, token_hash, purpose, expires_at)
             VALUES ($1, $2, 'reset_password', now() + make_interval(mins => $3::int))`,
            [userResult.rows[0].id, digestEmailCode(userResult.rows[0].id, resetCode), EMAIL_CODE_TTL_MINUTES],
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }

      if (shouldSend) {
        try {
          await sendPasswordResetCodeEmail({ to: email, code: resetCode });
        } catch (error) {
          console.error('Password reset code email delivery failed', {
            requestId: response.locals.requestId,
            message: error.message,
          });
        }
      }
    }
    sendSuccess(response, { message: genericMessage });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/auth/reset-password/verify', async (request, response, next) => {
  const email = normalizeEmail(request.body?.email);
  const code = typeof request.body?.code === 'string' ? request.body.code : '';
  try {
    if (!isValidEmail(email) || !/^\d{6}$/u.test(code)) throw INVALID_RESET_CODE();
    const client = await pool.connect();
    let valid = false;
    try {
      await client.query('BEGIN');
      valid = Boolean(await lockResetCode(client, email, code));
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    if (!valid) throw INVALID_RESET_CODE();
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

authRouter.post('/auth/reset-password', async (request, response, next) => {
  const email = normalizeEmail(request.body?.email);
  const code = typeof request.body?.code === 'string' ? request.body.code : '';
  const newPassword = request.body?.password;
  try {
    validateNewPassword(newPassword, 'password');
    if (!isValidEmail(email) || !/^\d{6}$/u.test(code)) throw INVALID_RESET_CODE();

    const client = await pool.connect();
    let valid = false;
    try {
      await client.query('BEGIN');
      const resetCode = await lockResetCode(client, email, code);
      if (resetCode) {
        const passwordHash = await hashPassword(newPassword);
        await client.query(
          `UPDATE users SET password_hash = $1, email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
           WHERE id = $2`,
          [passwordHash, resetCode.userId],
        );
        await client.query('UPDATE email_tokens SET used_at = now() WHERE id = $1', [resetCode.id]);
        await client.query('DELETE FROM member_sessions WHERE user_id = $1', [resetCode.userId]);
        valid = true;
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    if (!valid) throw INVALID_RESET_CODE();
    clearMemberSessionCookie(response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

authRouter.post('/auth/change-password', requireMember, async (request, response, next) => {
  const newPassword = request.body?.newPassword;
  try {
    validateNewPassword(newPassword);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userResult = await client.query(
        'SELECT password_hash AS "passwordHash" FROM users WHERE id = $1 AND suspended_at IS NULL FOR UPDATE',
        [request.member.id],
      );
      if (!userResult.rows[0]) throw new HttpError(401, 'UNAUTHENTICATED', '尚未登入');

      const sessionResult = await client.query(
        'SELECT id FROM member_sessions WHERE id = $1 AND user_id = $2 AND expires_at > now() FOR UPDATE',
        [request.member.sessionId, request.member.id],
      );
      if (!sessionResult.rows[0]) throw new HttpError(401, 'UNAUTHENTICATED', '尚未登入');

      const currentHash = userResult.rows[0].passwordHash;
      if (currentHash) {
        const currentPassword = request.body?.currentPassword;
        if (typeof currentPassword !== 'string' || !await verifyPassword(currentPassword, currentHash)) {
          throw new HttpError(400, 'CURRENT_PASSWORD_INCORRECT', '目前密碼不正確');
        }
        if (await verifyPassword(newPassword, currentHash)) {
          throw validationError({ newPassword: '新密碼不可與目前密碼相同' });
        }
      }

      const passwordHash = await hashPassword(newPassword);
      await client.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [passwordHash, request.member.id]);
      await client.query(
        'DELETE FROM member_sessions WHERE user_id = $1 AND id <> $2',
        [request.member.id, request.member.sessionId],
      );
      await client.query('COMMIT');
      response.status(204).end();
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      next(error);
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireMember, (request, response) => {
  sendSuccess(response, memberPayload(request.member));
});

authRouter.patch('/me/profile', requireMember, async (request, response, next) => {
  let profile;
  try {
    profile = validateMemberProfile(request.body?.username, request.body?.avatarId);
  } catch (error) {
    return next(error);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO member_profiles(user_id, nickname, avatar_id, onboarding_completed, updated_at)
       VALUES ($1, $2, $3, true, now())
       ON CONFLICT (user_id) DO UPDATE SET
         nickname = EXCLUDED.nickname,
         avatar_id = EXCLUDED.avatar_id,
         onboarding_completed = true,
         updated_at = now()`,
      [request.member.id, profile.username, profile.avatarId],
    );
    await client.query('COMMIT');
    sendSuccess(response, memberPayload({
      ...request.member,
      nickname: profile.username,
      avatarId: profile.avatarId,
      onboardingCompleted: true,
    }));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error.code === '23505'
      ? new HttpError(409, 'USERNAME_TAKEN', '此暱稱已被使用')
      : error);
  } finally {
    client.release();
  }
});

authRouter.post('/auth/logout', async (request, response, next) => {
  try {
    await revokeMemberSession(request, response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});
