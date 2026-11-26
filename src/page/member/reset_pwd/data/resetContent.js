// 重設密碼頁的文字與路徑（第一階段靜態資料，不串 API）。

// 第一階段沒有路由，所以先用 html 檔互連；
// 之後接上路由時，把 forgotPassword 換成 /forgot-password。
export const ROUTES = {
  login: "/login",
  forgotPassword: "../forget_pwd/index.html",
};

export const RESET_TEXT = {
  title: "重設密碼",
  description: "請設定新的密碼，設定完成後需要重新登入。",
  checking: "正在確認重設連結…",
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

// 示範用：之後串 API 就刪掉
export const DEMO_LINKS = [
  { label: "有效連結", href: "./index.html?token=demo-valid" },
  { label: "無效連結", href: "./index.html?token=demo-expired" },
  { label: "沒有 token", href: "./index.html" },
  { label: "開啟後才過期", href: "./index.html?token=demo-expire-on-submit" },
];
