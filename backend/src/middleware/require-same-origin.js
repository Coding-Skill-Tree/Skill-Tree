import { HttpError } from '../lib/http-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireSameOrigin(request, _response, next) {
  if (SAFE_METHODS.has(request.method)) return next();

  const origin = request.get('origin');
  const fetchSite = request.get('sec-fetch-site');
  const allowedOrigins = (process.env.APP_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (fetchSite === 'cross-site' || !origin || !allowedOrigins.includes(origin)) {
    return next(new HttpError(403, 'ORIGIN_NOT_ALLOWED', '不允許此來源執行操作'));
  }
  return next();
}
