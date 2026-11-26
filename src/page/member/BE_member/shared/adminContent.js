// 後台三頁（登入、會員列表、會員詳情）共用的文字與路徑（第一階段靜態資料，不串 API）。

export const ADMIN_SITE_NAME = "Skill Tree 後台";

// 第一階段沒有路由，三頁先用 html 檔互連；之後接上路由時換成註解裡的正式路徑。
export const ADMIN_ROUTES = {
  login: "../BE_login/index.html", // /admin/login
  members: "../BE_member/index.html", // /admin/members
  memberDetail: (id) => `../BE_memberDetail/index.html?id=${encodeURIComponent(id)}`, // /admin/members/:id
};

export const COMMON_TEXT = {
  logout: "登出",
  loggingOut: "登出中…",
  loading: "載入中…",
  loadFailed: "載入失敗，請再試一次",
  retry: "重試",
  actionFailed: "操作失敗，請再試一次",
  notSet: "（尚未設定）",
  statusActive: "正常",
  statusSuspended: "已停權",
};
