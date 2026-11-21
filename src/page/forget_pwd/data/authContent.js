// 忘記密碼頁的文字與路徑（第一階段靜態資料，不串 API）。
// 重設密碼頁的文字放在 src/page/reset_pwd/data/resetContent.js。

export const SITE_NAME = "Skill Tree";

// 之後接上路由時，把 forgotPassword 換成 /forgot-password。
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "./index.html",
};

export const FORGOT_TEXT = {
  title: "忘記密碼",
  description: "輸入註冊時使用的 Email，我們會寄一封重設密碼的連結給你。",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  submitLabel: "寄出重設連結",
  sendingLabel: "寄送中…",
  backToLogin: "回到登入",
  goRegister: "前往註冊",
  sentMessage: "已寄出重設密碼的連結，請到信箱查看",
  sentConfirm: "確定",
  genericError: "寄送失敗，請再試一次",
};

// 示範用：之後串 API 就刪掉
export const DEMO = {
  forgot: [
    { email: "nobody@example.com", result: "此帳號尚未註冊" },
    { email: "google@example.com", result: "此帳號使用 Google 註冊" },
    { email: "其他 Email", result: "已寄出重設連結（彈窗）" },
  ],
};
