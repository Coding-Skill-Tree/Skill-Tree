import { createHash, randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';
import { readCookie, sessionCookie } from '../lib/cookies.js';
import { runtimeConfig } from '../lib/runtime-config.js';

function digest(token) {
  return createHash('sha256').update(token).digest('hex');
}

function secureCookies() {
  return runtimeConfig.nodeEnv === 'production' || runtimeConfig.sessionCookieSecure;
}

export async function createMemberSession(userId, response) {
  const token = randomBytes(32).toString('base64url');
  const ttlDays = runtimeConfig.sessionTtlDays;
  const expiresAt = new Date(Date.now() + ttlDays * 86_400_000);
  await pool.query(
    'INSERT INTO member_sessions(user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, digest(token), expiresAt],
  );
  response.append('Set-Cookie', sessionCookie('sid', token, ttlDays * 86_400, { secure: secureCookies() }));
  return expiresAt;
}

export async function revokeMemberSession(request, response) {
  const token = readCookie(request, 'sid');
  if (token) await pool.query('DELETE FROM member_sessions WHERE token_hash = $1', [digest(token)]);
  clearMemberSessionCookie(response);
}

export function clearMemberSessionCookie(response) {
  response.append('Set-Cookie', sessionCookie('sid', '', 0, { secure: secureCookies(), clear: true }));
}

export async function createAdminSession(adminId, response) {
  const token = randomBytes(32).toString('base64url');
  const ttlHours = runtimeConfig.adminSessionTtlHours;
  const expiresAt = new Date(Date.now() + ttlHours * 3_600_000);
  await pool.query(
    'INSERT INTO admin_sessions(admin_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [adminId, digest(token), expiresAt],
  );
  response.append('Set-Cookie', sessionCookie('admin_sid', token, ttlHours * 3_600, { secure: secureCookies() }));
  return expiresAt;
}

export async function revokeAdminSession(request, response) {
  const token = readCookie(request, 'admin_sid');
  if (token) await pool.query('DELETE FROM admin_sessions WHERE token_hash = $1', [digest(token)]);
  response.append('Set-Cookie', sessionCookie('admin_sid', '', 0, { secure: secureCookies(), clear: true }));
}
