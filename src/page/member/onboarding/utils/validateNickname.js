// 暱稱規則（與 API 相同）：去掉前後空白後 2～12 個字（以 Unicode 字元計），
// 只能包含中文、英文字母、數字與底線。兩條都違反時優先顯示長度訊息。

export const NICKNAME_MESSAGES = {
  length: "暱稱需為 2 到 12 個字",
  chars: "暱稱只能包含中文、英文、數字與底線",
};

const ALLOWED = /^[\p{Script=Han}A-Za-z0-9_]+$/u;

export function validateNickname(value) {
  const trimmed = value.trim();
  const length = [...trimmed].length;
  if (length < 2 || length > 12) return NICKNAME_MESSAGES.length;
  if (!ALLOWED.test(trimmed)) return NICKNAME_MESSAGES.chars;
  return "";
}
