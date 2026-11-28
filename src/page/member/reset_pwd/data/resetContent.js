// 重設密碼頁的文字與路徑。

export const ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
};

export const RESET_TEXT = {
  title: "重設密碼",
  description: "輸入 Email 中的六位數驗證碼，再設定新密碼。驗證碼 10 分鐘內有效。",
  emailLabel: "Email",
  codeLabel: "六位數驗證碼",
  codeHint: "驗證碼只可使用一次；連續輸入錯誤 5 次後需重新申請。",
  codeFormat: "請輸入 6 位數字",
  invalidCode: "驗證碼無效、已過期或已達輸入次數上限。請重新申請驗證碼。",
  passwordLabel: "新密碼",
  confirmLabel: "確認新密碼",
  passwordHint: "8 到 25 個字元，需含英文字母與數字",
  submitLabel: "重設密碼",
  sendingLabel: "重設中…",
  requestNewCode: "重新申請驗證碼",
  successNotice: "密碼已重設，請重新登入",
  successTitle: "密碼已重設",
  successDescription: "請使用新密碼重新登入。",
  goLogin: "前往登入",
  genericError: "重設失敗，請再試一次",
};
