// 個人檔案頁的文字與路徑（第一階段靜態資料，不串 API）。

export const SITE_NAME = "Skill Tree";

// 正式路由。第一階段建立角色頁還沒接路由，所以 onboarding 先指向它的 html 檔。
export const ROUTES = {
  home: "/",
  login: "/login",
  onboarding: "/onboarding",
  learn: "/skillmap",
  profile: "/profile",
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
  edit: "編輯",
  editLabel: "編輯基本資料",
  save: "儲存",
  saving: "儲存中…",
  cancel: "取消",
  saveFailed: "儲存失敗，請再試一次",
  usernameTaken: "此暱稱已被使用",
  logout: "登出",
  loggingOut: "登出中…",
  logoutFailed: "登出失敗，請再試一次",
  loading: "載入中…",
  loadFailed: "載入失敗，請再試一次",
  retry: "重試",
};
export const NAV_LINKS = [
  { label: "技能樹地圖", href: ROUTES.learn },
  { label: "個人檔案", href: ROUTES.profile, current: true },
];
