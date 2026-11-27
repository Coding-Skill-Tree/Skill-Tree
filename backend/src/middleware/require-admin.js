import { createHash } from 'node:crypto';
import { pool } from '../db/pool.js';
import { readCookie } from '../lib/cookies.js';
import { HttpError } from '../lib/http-error.js';

export async function requireAdmin(request, _response, next) {
  try {
    const token = readCookie(request, 'admin_sid');
    if (!token) throw new HttpError(401, 'ADMIN_UNAUTHENTICATED', '請先登入後台');

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const { rows } = await pool.query(
      `SELECT a.id, a.username, a.role
       FROM admin_sessions s
       JOIN admin_accounts a ON a.id = s.admin_id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND a.disabled_at IS NULL`,
      [tokenHash],
    );

    if (!rows[0]) throw new HttpError(401, 'ADMIN_UNAUTHENTICATED', '請先登入後台');
    request.admin = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

export function requireOwner(request, _response, next) {
  if (request.admin?.role === 'owner') return next();
  return next(new HttpError(403, 'ADMIN_OWNER_REQUIRED', '此操作需要專案最高管理權限'));
}
