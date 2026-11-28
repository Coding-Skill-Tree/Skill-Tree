// 忘記密碼頁的文字與路徑。
// 重設密碼頁的文字放在 src/page/member/reset_pwd/data/resetContent.js。

export const SITE_NAME = "Skill Tree";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  onboarding: "/onboarding",
  learn: "/skillmap",
  forgotPassword: "/forgot-password",
};

export const FORGOT_TEXT = {
  title: "忘記密碼",
  description: "輸入註冊時使用的 Email；如果符合帳號，我們會寄出六位數密碼重設驗證碼。",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  submitLabel: "寄出驗證碼",
  sendingLabel: "寄送中…",
  backToLogin: "回到登入",
  sentMessage: "如果此 Email 已註冊，我們已寄出六位數驗證碼。驗證碼 10 分鐘內有效，請到信箱查看。",
  sentConfirm: "前往輸入驗證碼",
  genericError: "寄送失敗，請再試一次",
};
