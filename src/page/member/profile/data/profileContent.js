// 個人檔案頁的文字與路徑。

export const SITE_NAME = "Skill Tree";

export const ROUTES = {
  home: "/",
  login: "/login",
  onboarding: "/onboarding",
  learn: "/skillmap",
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
  logoutFailed: "登出失敗，請確認網路後再試一次。",
  loading: "載入中…",
  loadFailed: "載入失敗，請再試一次",
  retry: "重試",
};

export const NAV_LINKS = [
  { label: "技能樹地圖", href: ROUTES.learn },
  { label: "個人檔案", href: ROUTES.profile, current: true },
];
