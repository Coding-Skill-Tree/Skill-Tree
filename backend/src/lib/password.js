import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const N = 32_768;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `$scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${Buffer.from(key).toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  const parts = encoded.split('$');
  if (parts.length !== 7 || parts[1] !== 'scrypt') return false;
  const [, , nText, rText, pText, saltText, keyText] = parts;
  const n = Number(nText);
  const blockSize = Number(rText);
  const parallelization = Number(pText);
  if (n !== N || blockSize !== r || parallelization !== p) return false;
  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(keyText, 'base64url');
  const actual = Buffer.from(await scrypt(password, salt, expected.length, { N: n, r: blockSize, p: parallelization, maxmem: 64 * 1024 * 1024 }));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
