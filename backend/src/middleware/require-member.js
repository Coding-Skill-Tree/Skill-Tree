import { createHash } from 'node:crypto';
import { pool } from '../db/pool.js';
import { readCookie } from '../lib/cookies.js';
import { HttpError } from '../lib/http-error.js';

export async function requireMember(request, _response, next) {
  try {
    const token = readCookie(request, 'sid');
    if (!token) throw new HttpError(401, 'UNAUTHENTICATED', '尚未登入');

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const { rows } = await pool.query(
      `SELECT u.id, s.id AS "sessionId", u.email_normalized AS email, u.created_at AS "createdAt", p.nickname, p.avatar_id AS "avatarId",
              p.route, p.onboarding_completed AS "onboardingCompleted", u.password_hash IS NOT NULL AS "hasPassword"
       FROM member_sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN member_profiles p ON p.user_id = u.id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND u.suspended_at IS NULL`,
      [tokenHash],
    );

    if (!rows[0]) throw new HttpError(401, 'UNAUTHENTICATED', '尚未登入');
    request.member = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}
