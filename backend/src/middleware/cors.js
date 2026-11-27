import { runtimeConfig } from '../lib/runtime-config.js';

const ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type,Authorization,Idempotency-Key,X-Request-Id';

export function corsAllowlist(request, response, next) {
  const origin = request.get('origin');
  response.vary('Origin');
  if (origin && runtimeConfig.appOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
    response.set('Access-Control-Allow-Credentials', 'true');
  }

  if (request.method === 'OPTIONS') {
    if (origin && runtimeConfig.appOrigins.includes(origin)) {
      response.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
      response.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
      response.set('Access-Control-Max-Age', '600');
    }
    return response.status(204).end();
  }
  return next();
}
