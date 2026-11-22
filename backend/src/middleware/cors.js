const ALLOWED_METHODS = 'GET,POST,PATCH,DELETE,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type,Authorization,X-Request-Id';

export function corsAllowlist(request, response, next) {
  const origin = request.get('origin');
  const allowlist = (process.env.APP_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  response.vary('Origin');
  if (origin && allowlist.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
    response.set('Access-Control-Allow-Credentials', 'true');
  }

  if (request.method === 'OPTIONS') {
    if (origin && allowlist.includes(origin)) {
      response.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
      response.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
      response.set('Access-Control-Max-Age', '600');
    }
    return response.status(204).end();
  }
  return next();
}
