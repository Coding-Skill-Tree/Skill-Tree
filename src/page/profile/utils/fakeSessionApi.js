// 第一階段的假 API：模擬後端的回應格式（團隊 API 信封 success / data / error）。
// 之後串 API 時，把這兩個函式換成 fetch，回傳一樣的 { status, body } 即可，頁面不用改。
// 正式版的登入狀態會在網站啟動時載入一次並放在共用的 context，個人檔案頁直接讀取，
// 不會另外發請求；第一階段沒有 context，所以這裡由頁面自己呼叫一次。

const DELAY_MS = 600;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 示範用的狀態：網址 ?demo=loading | error | not-onboarded | signed-out
const demo = new URLSearchParams(window.location.search).get("demo");

const DEMO_USER = {
  userId: "1",
  username: "小明",
  email: "amy@example.com",
  avatarId: "avatar-03",
  onboardingCompleted: true,
  createdAt: "2026-11-15T03:00:00.000Z",
};

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
        data: { ...DEMO_USER, username: null, avatarId: null, onboardingCompleted: false },
      },
    };
  }
  return { status: 200, body: { success: true, data: DEMO_USER } };
}

// POST /api/auth/logout
export async function logout() {
  await wait(DELAY_MS);
  return { status: 204, body: null };
}
