import 'dotenv/config';

const NODE_ENVS = new Set(['development', 'test', 'production']);

function integerSetting(name, fallback, min, max) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} 必須是 ${min} 到 ${max} 的整數`);
  }
  return value;
}

function booleanSetting(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${name} 必須是 true 或 false`);
}

function nodeEnvSetting() {
  const value = process.env.NODE_ENV || 'development';
  if (!NODE_ENVS.has(value)) throw new Error('NODE_ENV 必須是 development、test 或 production');
  return value;
}

function originSetting() {
  const configured = process.env.APP_ORIGINS?.trim();
  if (process.env.NODE_ENV === 'production' && !configured) {
    throw new Error('正式環境必須設定 APP_ORIGINS');
  }
  const raw = configured || 'http://localhost:3000,http://127.0.0.1:3000';
  const origins = [...new Set(raw.split(',').map((value) => value.trim()).filter(Boolean))];
  if (origins.length === 0) throw new Error('APP_ORIGINS 至少要有一個允許的來源');

  for (const origin of origins) {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`APP_ORIGINS 包含無效網址：${origin}`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error(`APP_ORIGINS 只能包含沒有路徑的 HTTP(S) origin：${origin}`);
    }
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      throw new Error(`正式環境的 APP_ORIGINS 必須使用 HTTPS：${origin}`);
    }
  }
  return origins;
}

function databaseSslSetting() {
  const enabled = booleanSetting('DATABASE_SSL', false);
  if (process.env.NODE_ENV === 'production' && !enabled) {
    throw new Error('正式環境必須設定 DATABASE_SSL=true');
  }
  return enabled;
}

function emailCodeSecretSetting() {
  const secret = process.env.EMAIL_CODE_SECRET || '';
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('正式環境必須設定至少 32 個字元的 EMAIL_CODE_SECRET');
  }
  return secret || 'local-development-only-email-code-secret';
}

export const runtimeConfig = Object.freeze({
  nodeEnv: nodeEnvSetting(),
  port: integerSetting('PORT', 3000, 1, 65535),
  databasePoolMax: integerSetting('DB_POOL_MAX', 10, 1, 100),
  trustProxyHops: integerSetting('TRUST_PROXY_HOPS', 0, 0, 5),
  apiRateLimitRequests: integerSetting('API_RATE_LIMIT_REQUESTS', 300, 1, 100000),
  authRateLimitRequests: integerSetting('AUTH_RATE_LIMIT_REQUESTS', 20, 1, 10000),
  sessionTtlDays: integerSetting('SESSION_TTL_DAYS', 15, 1, 365),
  adminSessionTtlHours: integerSetting('ADMIN_SESSION_TTL_HOURS', 8, 1, 168),
  loginMaxFailures: integerSetting('LOGIN_MAX_FAILURES', 5, 1, 100),
  loginFailureWindowMinutes: integerSetting('LOGIN_FAILURE_WINDOW_MINUTES', 15, 1, 1440),
  loginCooldownMinutes: integerSetting('LOGIN_COOLDOWN_MINUTES', 5, 1, 1440),
  sessionCookieSecure: booleanSetting('SESSION_COOKIE_SECURE', false),
  appOrigins: originSetting(),
  databaseSsl: databaseSslSetting(),
  emailCodeSecret: emailCodeSecretSetting(),
});
