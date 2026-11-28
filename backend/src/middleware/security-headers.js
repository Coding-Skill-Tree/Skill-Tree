import { runtimeConfig } from '../lib/runtime-config.js';

const API_CONTENT_SECURITY_POLICY = "default-src 'none'; base-uri 'none'; frame-ancestors 'none'";
const DOCS_CONTENT_SECURITY_POLICY = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'";

export function securityHeaders(request, response, next) {
  if (request.path.startsWith('/api/')) {
    response.set('Cache-Control', 'no-store, max-age=0');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');
    response.set('X-Frame-Options', 'DENY');
    response.set('Referrer-Policy', 'no-referrer');
    response.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
    response.set('Cross-Origin-Resource-Policy', 'same-origin');
    response.set(
      'Content-Security-Policy',
      request.path.startsWith('/api/docs') ? DOCS_CONTENT_SECURITY_POLICY : API_CONTENT_SECURITY_POLICY,
    );
    if (runtimeConfig.nodeEnv === 'production') {
      response.set('Strict-Transport-Security', 'max-age=31536000');
    }
  }
  next();
}
