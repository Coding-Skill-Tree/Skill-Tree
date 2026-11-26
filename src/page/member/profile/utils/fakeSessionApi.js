// 第一階段的假 API：模擬後端的回應格式（團隊 API 信封 success / data / error）。
// 之後串 API 時，把這些函式換成 fetch，回傳一樣的 { status, body } 即可，頁面不用改。
// 正式版的登入狀態會在網站啟動時載入一次並放在共用的 context，個人檔案頁直接讀取，
// 不會另外發請求；第一階段沒有 context，所以這裡由頁面自己呼叫一次。

import { DEMO_TAKEN_NICKNAMES } from "../data/profileContent.js";
import { validateNickname } from "../../onboarding/utils/validateNickname.js";
import { AVATARS } from "../../onboarding/data/characterOptions.js";

const DELAY_MS = 600;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 示範用的狀態：網址 ?demo=loading | error | not-onboarded | signed-out | save-error
const demo = new URLSearchParams(window.location.search).get("demo");

const DEMO_USER = {
  userId: "1",
  username: "小明",
  email: "amy@example.com",
  avatarId: "avatar-03",
  onboardingCompleted: true,
  createdAt: "2026-11-15T03:00:00.000Z",
};

// 示範用：儲存過的暱稱與角色放在 sessionStorage，重新整理後還看得到，關掉分頁就清空
const STORE_KEY = "demo-profile-user";

function readUser() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY));
    return saved ? { ...DEMO_USER, ...saved } : DEMO_USER;
  } catch {
    return DEMO_USER;
  }
}

// GET /api/me
// isRetry 只給示範用（按過「重試」才成功），正式版的 fetch 不需要這個參數
export async function getMe({ isRetry = false } = {}) {
  if (demo === "loading") return new Promise(() => {}); // 一直停在載入中
  await wait(DELAY_MS);

  if (demo === "error" && !isRetry) {
    return { status: 503, body: null };
  }
  if (demo === "signed-out") {
    return {
      status: 401,
      body: { success: false, error: { code: "UNAUTHENTICATED", message: "尚未登入" } },
    };
  }
  if (demo === "not-onboarded") {
    return {
      status: 200,
      body: {
        success: true,
        data: { ...readUser(), username: null, avatarId: null, onboardingCompleted: false },
      },
    };
  }
  return { status: 200, body: { success: true, data: readUser() } };
}

// 暱稱比對：去掉前後空白、不分大小寫
const sameNickname = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// PATCH /api/me：更新暱稱與角色。檢查順序：401 → 409 未完成建立角色 → 422 → 409 暱稱重複
// 比對暱稱時排除自己，所以把自己的暱稱只改大小寫也可以儲存。
export async function updateMe({ username, avatarId }) {
  await wait(DELAY_MS);
  if (demo === "save-error") return { status: 500, body: null };

  const fields = {};
  const nicknameError = validateNickname(username ?? "");
  if (nicknameError) fields.username = nicknameError;
  if (!AVATARS.some((a) => a.id === avatarId)) fields.avatarId = "請選擇角色";
  if (Object.keys(fields).length > 0) {
    return {
      status: 422,
      body: { success: false, error: { code: "VALIDATION_ERROR", message: "資料格式不正確", fields } },
    };
  }

  const trimmed = username.trim();
  if (DEMO_TAKEN_NICKNAMES.some((name) => sameNickname(name, trimmed))) {
    return {
      status: 409,
      body: { success: false, error: { code: "USERNAME_TAKEN", message: "此暱稱已被使用" } },
    };
  }

  const user = { ...readUser(), username: trimmed, avatarId };
  sessionStorage.setItem(STORE_KEY, JSON.stringify({ username: trimmed, avatarId }));
  return { status: 200, body: { success: true, data: user } };
}

// POST /api/auth/logout
export async function logout() {
  await wait(DELAY_MS);
  return { status: 204, body: null };
}
