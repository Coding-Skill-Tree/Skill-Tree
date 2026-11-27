import { runtimeConfig } from '../lib/runtime-config.js';

const WINDOW_MS = 60_000;
const MAX_BUCKETS = 20_000;
const PRUNE_EVERY = 256;

export function createApiRateLimit({
  apiLimit = runtimeConfig.apiRateLimitRequests,
  authLimit = runtimeConfig.authRateLimitRequests,
  windowMs = WINDOW_MS,
  maxBuckets = MAX_BUCKETS,
  now = Date.now,
} = {}) {
  const buckets = new Map();
  let requestsSincePrune = 0;

  function prune(currentTime) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= currentTime) buckets.delete(key);
    }
    while (buckets.size >= maxBuckets) {
      buckets.delete(buckets.keys().next().value);
    }
  }

  return function apiRateLimit(request, response, next) {
    const currentTime = now();
    const path = request.originalUrl?.split('?')[0] || request.path;
    const authRequest = path.startsWith('/api/auth/') || path.startsWith('/api/admin/auth/');
    const limit = authRequest ? authLimit : apiLimit;
    const clientAddress = request.ip || request.socket?.remoteAddress || 'unknown';
    const key = `${authRequest ? 'auth' : 'api'}:${clientAddress}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= currentTime) {
      if (buckets.size >= maxBuckets || requestsSincePrune >= PRUNE_EVERY) {
        prune(currentTime);
        requestsSincePrune = 0;
      }
      bucket = { count: 0, resetAt: currentTime + windowMs };
    }

    bucket.count += 1;
    buckets.delete(key);
    buckets.set(key, bucket);
    requestsSincePrune += 1;

    if (bucket.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000));
      response.set('Retry-After', String(retryAfter));
      return response.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: '請求過於頻繁，請稍後再試',
          requestId: response.locals.requestId,
        },
      });
    }

    return next();
  };
}

export const apiRateLimit = createApiRateLimit();
