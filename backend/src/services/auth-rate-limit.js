import { createHash } from 'node:crypto';
import { pool } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

const DEFAULT_MAX_FAILURES = 5;
const DEFAULT_WINDOW_MINUTES = 15;
const DEFAULT_COOLDOWN_MINUTES = 5;

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function policy() {
  return {
    maxFailures: positiveInteger(process.env.LOGIN_MAX_FAILURES, DEFAULT_MAX_FAILURES),
    windowMinutes: positiveInteger(process.env.LOGIN_FAILURE_WINDOW_MINUTES, DEFAULT_WINDOW_MINUTES),
    cooldownMinutes: positiveInteger(process.env.LOGIN_COOLDOWN_MINUTES, DEFAULT_COOLDOWN_MINUTES),
  };
}

export function hashRateLimitSubject(scope, subject) {
  return createHash('sha256').update(`${scope}:${subject}`).digest('hex');
}

export async function assertLoginNotBlocked(scope, subjectHash) {
  const { cooldownMinutes } = policy();
  const result = await pool.query(
    `SELECT blocked_until > now() AS blocked
     FROM auth_rate_limits WHERE scope = $1 AND subject_hash = $2`,
    [scope, subjectHash],
  );
  if (result.rows[0]?.blocked) {
    throw new HttpError(429, 'TOO_MANY_ATTEMPTS', `嘗試次數過多，請 ${cooldownMinutes} 分鐘後再試`);
  }
}

export async function recordLoginFailure(scope, subjectHash) {
  const { maxFailures, windowMinutes, cooldownMinutes } = policy();
  await pool.query(
    `INSERT INTO auth_rate_limits (scope, subject_hash, failure_count, first_failure_at, updated_at)
     VALUES ($1, $2, 1, now(), now())
     ON CONFLICT (scope, subject_hash) DO UPDATE SET
       failure_count = CASE
         WHEN auth_rate_limits.first_failure_at IS NULL
           OR auth_rate_limits.first_failure_at <= now() - make_interval(mins => $3)
           OR (auth_rate_limits.blocked_until IS NOT NULL AND auth_rate_limits.blocked_until <= now())
         THEN 1 ELSE auth_rate_limits.failure_count + 1 END,
       first_failure_at = CASE
         WHEN auth_rate_limits.first_failure_at IS NULL
           OR auth_rate_limits.first_failure_at <= now() - make_interval(mins => $3)
           OR (auth_rate_limits.blocked_until IS NOT NULL AND auth_rate_limits.blocked_until <= now())
         THEN now() ELSE auth_rate_limits.first_failure_at END,
       blocked_until = CASE
         WHEN CASE
           WHEN auth_rate_limits.first_failure_at IS NULL
             OR auth_rate_limits.first_failure_at <= now() - make_interval(mins => $3)
             OR (auth_rate_limits.blocked_until IS NOT NULL AND auth_rate_limits.blocked_until <= now())
           THEN 1 ELSE auth_rate_limits.failure_count + 1 END >= $4
         THEN now() + make_interval(mins => $5) ELSE NULL END,
       updated_at = now()`,
    [scope, subjectHash, windowMinutes, maxFailures, cooldownMinutes],
  );
}

export async function clearLoginFailures(scope, subjectHash) {
  await pool.query('DELETE FROM auth_rate_limits WHERE scope = $1 AND subject_hash = $2', [scope, subjectHash]);
}
