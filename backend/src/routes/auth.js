import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';
import { requireMember } from '../middleware/require-member.js';
import { HttpError } from '../lib/http-error.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { isValidEmail, normalizeEmail, validateLogin, validateNewPassword, validateRegistration } from '../lib/validation.js';
import { assertLoginNotBlocked, clearLoginFailures, hashRateLimitSubject, recordLoginFailure } from '../services/auth-rate-limit.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email-service.js';
import { createMemberSession, revokeMemberSession } from '../services/session-service.js';

export const authRouter = Router();

let dummyPasswordHashPromise;
function dummyPasswordHash() {
  dummyPasswordHashPromise ||= hashPassword(randomBytes(32).toString('hex'));
  return dummyPasswordHashPromise;
}

function memberPayload(member) {
  return {
    id: String(member.id),
    email: member.email,
    createdAt: new Date(member.createdAt).toISOString(),
    nickname: member.nickname,
    avatarId: member.avatarId,
    route: member.route,
    onboardingCompleted: member.onboardingCompleted,
    hasPassword: member.hasPassword,
  };
}

function tokenDigest(token) {
  return createHash('sha256').update(token).digest('hex');
}

authRouter.post('/auth/register', async (request, response, next) => {
  const email = normalizeEmail(request.body?.email);
  const password = request.body?.password;
  try {
    validateRegistration(email, password);
    const passwordHash = await hashPassword(password);
    const verificationToken = randomBytes(32).toString('base64url');
    const client = await pool.connect();
    let userId;
    try {
      await client.query('BEGIN');
      const userResult = await client.query(
        'INSERT INTO users(email_normalized, password_hash) VALUES ($1, $2) RETURNING id',
        [email, passwordHash],
      );
      userId = userResult.rows[0].id;
      await client.query('INSERT INTO member_profiles(user_id) VALUES ($1)', [userId]);
      await client.query(
        `INSERT INTO email_tokens(user_id, token_hash, purpose, expires_at)
         VALUES ($1, $2, 'verify_email', now() + interval '24 hours')`,
        [userId, tokenDigest(verificationToken)],
      );
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

    try {
      await sendVerificationEmail({ to: email, token: verificationToken });
    } catch (error) {
      console.error('Verification email delivery failed', {
        requestId: response.locals.requestId,
        message: error.message,
      });
    }
    response.status(201).json({ success: true, data: { email } });
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
    response.json({ success: true, data: { emailVerified: true } });
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
    response.json({ success: true, data: memberPayload(member) });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/auth/forgot-password', async (request, response, next) => {
  const email = normalizeEmail(request.body?.email);
  const genericMessage = '若此 Email 已註冊，我們已寄出重設密碼的連結';
  if (!isValidEmail(email)) {
    return next(new HttpError(400, 'VALIDATION_ERROR', '表單內容有誤', { fields: { email: '請輸入有效的 Email' } }));
  }

  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email_normalized = $1', [email]);
    if (userResult.rows[0]) {
      const subjectHash = hashRateLimitSubject('password_reset', email);
      const resetToken = randomBytes(32).toString('base64url');
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
             VALUES ($1, $2, 'reset_password', now() + interval '1 hour')`,
            [userResult.rows[0].id, tokenDigest(resetToken)],
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
          await sendPasswordResetEmail({ to: email, token: resetToken });
        } catch (error) {
          console.error('Password reset email delivery failed', {
            requestId: response.locals.requestId,
            message: error.message,
          });
        }
      }
    }
    response.json({ success: true, data: { message: genericMessage } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/auth/reset-password', async (request, response, next) => {
  const token = typeof request.body?.token === 'string' ? request.body.token : '';
  const newPassword = request.body?.password;
  try {
    validateNewPassword(newPassword, 'password');
    if (!token || token.length > 256) throw new HttpError(400, 'INVALID_TOKEN', '重設連結無效或已過期');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tokenResult = await client.query(
        `SELECT id, user_id FROM email_tokens
         WHERE token_hash = $1 AND purpose = 'reset_password' AND used_at IS NULL AND expires_at > now()
         FOR UPDATE`,
        [tokenDigest(token)],
      );
      const resetToken = tokenResult.rows[0];
      if (!resetToken) throw new HttpError(400, 'INVALID_TOKEN', '重設連結無效或已過期');

      const passwordHash = await hashPassword(newPassword);
      await client.query(
        `UPDATE users SET password_hash = $1, email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
         WHERE id = $2`,
        [passwordHash, resetToken.user_id],
      );
      await client.query('UPDATE email_tokens SET used_at = now() WHERE id = $1', [resetToken.id]);
      await client.query('DELETE FROM member_sessions WHERE user_id = $1', [resetToken.user_id]);
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
          throw new HttpError(400, 'VALIDATION_ERROR', '表單內容有誤', {
            fields: { newPassword: '新密碼不可與目前密碼相同' },
          });
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
  response.json({ success: true, data: memberPayload(request.member) });
});

authRouter.post('/auth/logout', async (request, response, next) => {
  try {
    await revokeMemberSession(request, response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});
