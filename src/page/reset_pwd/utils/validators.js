// 密碼規則與訊息（和註冊頁、API 相同）。回傳空字串代表沒有錯誤。

export const MESSAGES = {
  password: "密碼需由 8 ~ 25 個英文字母與數字組成之字元",
  confirm: "兩次輸入的密碼不一致",
};

// 密碼：8～25 個字，只能是英文字母與數字，且兩種都要有
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,25}$/;

export function validatePassword(value) {
  return PASSWORD_PATTERN.test(value) ? "" : MESSAGES.password;
}

export function validateConfirm(password, confirm) {
  return password === confirm ? "" : MESSAGES.confirm;
}
