import { HttpError } from '../lib/http-error.js';
import { runtimeConfig } from '../lib/runtime-config.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireSameOrigin(request, _response, next) {
  if (SAFE_METHODS.has(request.method)) return next();

  const origin = request.get('origin');
  const fetchSite = request.get('sec-fetch-site');
  if (fetchSite === 'cross-site' || !origin || !runtimeConfig.appOrigins.includes(origin)) {
    return next(new HttpError(403, 'ORIGIN_NOT_ALLOWED', '不允許此來源執行操作'));
  }
  return next();
}
