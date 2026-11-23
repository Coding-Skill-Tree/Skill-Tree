// 個人檔案頁的文字與路徑（第一階段靜態資料，不串 API）。

export const SITE_NAME = "Skill Tree";

// 正式路由。第一階段建立角色頁還沒接路由，所以 onboarding 先指向它的 html 檔。
export const ROUTES = {
  home: "/",
  login: "/login",
  onboarding: "../onboarding/index.html",
  learn: "/learn",
  profile: "/profile",
  dashboard: "/dashboard",
};

export const PROFILE_TEXT = {
  title: "個人檔案",
  basicInfoTitle: "基本資料",
  labels: {
    avatar: "角色",
    username: "暱稱",
    email: "Email",
    joinDate: "加入日期",
  },
  entryTitle: "前往",
  entryDescription: "查看你的 XP、等級與學習進度",
  entryButton: "查看遊戲數據",
  backToMap: "回到技能樹地圖",
  logout: "登出",
  loggingOut: "登出中…",
  loading: "載入中…",
  loadFailed: "載入失敗，請再試一次",
  retry: "重試",
};

export const NAV_LINKS = [
  { label: "技能樹地圖", href: ROUTES.learn },
  { label: "個人檔案", href: ROUTES.profile, current: true },
];

// 示範用：在網址加上 ?demo=...，可以看到各種狀態。串 API 後刪掉
export const DEMO_LINKS = [
  { label: "正常", href: "./index.html" },
  { label: "載入中", href: "./index.html?demo=loading" },
  { label: "載入失敗（按重試會成功）", href: "./index.html?demo=error" },
  { label: "未完成建立角色", href: "./index.html?demo=not-onboarded" },
  { label: "未登入", href: "./index.html?demo=signed-out" },
];
