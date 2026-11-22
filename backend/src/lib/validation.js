import { HttpError } from './http-error.js';

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(value) {
  return value.length <= 100 && /^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/u.test(value);
}

export function isValidPassword(value) {
  return typeof value === 'string' && /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,25}$/.test(value);
}

export function validateNewPassword(password, field = 'newPassword') {
  if (isValidPassword(password)) return;
  throw new HttpError(400, 'VALIDATION_ERROR', '表單內容有誤', {
    fields: { [field]: '密碼需為 8 到 25 個字，且包含英文字母與數字' },
  });
}

export function validateRegistration(email, password) {
  const fields = {};
  if (!isValidEmail(email)) fields.email = '請輸入有效的 Email';
  if (!isValidPassword(password)) {
    fields.password = '密碼需為 8 到 25 個字，且包含英文字母與數字';
  }
  if (Object.keys(fields).length) {
    throw new HttpError(400, 'VALIDATION_ERROR', '表單內容有誤', { fields });
  }
}

export function validateLogin(email, password, username = false) {
  const fields = {};
  if (username) {
    if (typeof email !== 'string' || !/^[a-z0-9_]{3,32}$/i.test(email.trim())) {
      fields.username = '請輸入有效的管理員帳號';
    }
  } else if (!isValidEmail(email)) {
    fields.email = '請輸入有效的 Email';
  }
  if (typeof password !== 'string' || password.length === 0 || password.length > 1024) {
    fields.password = '請輸入密碼';
  }
  if (Object.keys(fields).length) {
    throw new HttpError(400, 'VALIDATION_ERROR', '表單內容有誤', { fields });
  }
}
