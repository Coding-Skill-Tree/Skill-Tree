// 會員註冊、登入表單的前端檢查（對應 會員註冊規格 需求 2、會員登入規格 需求 1）。
// 這些只是前端先擋一次，不取代後端的檢查。

const EMAIL_PATTERN = /^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/u;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,25}$/;

// 回傳錯誤訊息；沒有錯誤時回傳空字串。
export function getEmailError(value) {
  const email = value.trim();
  const valid = email.length <= 100 && EMAIL_PATTERN.test(email);
  return valid ? '' : '請輸入有效的 Email';
}

export function getRegisterPasswordError(value) {
  return PASSWORD_PATTERN.test(value) ? '' : '密碼需為 8 到 25 個字，且包含英文字母與數字';
}

export function getConfirmPasswordError(password, confirmPassword) {
  return password === confirmPassword ? '' : '兩次輸入的密碼不一致';
}

export function getLoginPasswordError(value) {
  return value.length === 0 ? '請輸入密碼' : '';
}

// 只保留有錯誤的欄位，方便直接當作 fieldErrors 使用。
export function pickErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}
