export function readCookie(request, name) {
  const cookieHeader = request.headers.cookie || '';
  for (const entry of cookieHeader.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0) continue;
    const key = entry.slice(0, separator).trim();
    if (key === name) {
      try { return decodeURIComponent(entry.slice(separator + 1).trim()); }
      catch { return null; }
    }
  }
  return null;
}

export function sessionCookie(name, value, maxAgeSeconds, { secure = false, clear = false } = {}) {
  const parts = [`${name}=${clear ? '' : encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  parts.push(`Max-Age=${clear ? 0 : maxAgeSeconds}`);
  return parts.join('; ');
}
