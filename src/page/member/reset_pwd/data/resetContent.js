// 重設密碼頁的文字與路徑。

export const ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
};

export const RESET_TEXT = {
  title: "重設密碼",
  description: "請設定新的密碼，設定完成後需要重新登入。",
  checking: "正在確認重設連結…",
  verifyFailed: "目前無法確認重設連結，請稍後再試。",
  retryVerification: "重新確認",
  passwordLabel: "新密碼",
  confirmLabel: "確認新密碼",
  passwordHint: "8 到 25 個字元，需含英文字母與數字",
  submitLabel: "重設密碼",
  sendingLabel: "重設中…",
  invalidMessage: "重設連結無效或已過期",
  invalidAction: "重新申請",
  successNotice: "密碼已重設，請重新登入",
  successTitle: "密碼已重設",
  successDescription: "請使用新密碼重新登入。",
  goLogin: "前往登入",
  genericError: "重設失敗，請再試一次",
};
