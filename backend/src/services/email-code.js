import { createHmac, randomInt } from 'node:crypto';
import { runtimeConfig } from '../lib/runtime-config.js';

export const EMAIL_CODE_TTL_MINUTES = 10;
export const EMAIL_CODE_MAX_ATTEMPTS = 5;

export function generateEmailCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function digestEmailCode(userId, code) {
  return createHmac('sha256', runtimeConfig.emailCodeSecret)
    .update(`password-reset:${userId}:${code}`)
    .digest('hex');
}
