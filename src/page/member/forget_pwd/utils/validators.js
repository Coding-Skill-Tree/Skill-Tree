// Email 規則與訊息（和註冊頁、API 相同）。回傳空字串代表沒有錯誤。
// 密碼規則放在 src/page/reset_pwd/utils/validators.js。

export const MESSAGES = {
  email: "請輸入有效的 Email",
};

// Email：去掉前後空白，@ 後面的網域轉小寫，@ 前面保留大小寫
export function normalizeEmail(value) {
  const trimmed = value.trim();
  const at = trimmed.lastIndexOf("@");
  if (at === -1) return trimmed;
  return trimmed.slice(0, at) + "@" + trimmed.slice(at + 1).toLowerCase();
}

// 有效格式：local@domain，網域至少一個點、不含空白、最多 100 個字
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email || email.length > 100 || !EMAIL_PATTERN.test(email)) return MESSAGES.email;
  return "";
}
