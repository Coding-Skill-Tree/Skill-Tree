// 第一階段的假 API：模擬後端的回應格式（團隊 API 信封 success / data / error），
// 讓畫面的各種狀態都能看到。之後串 API 時，只要把這兩個函式換成 fetch，
// 回傳一樣的 { status, body } 即可，頁面不用改。

const DELAY_MS = 600;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const INVALID_TOKEN = () => ({
  status: 400,
  body: {
    success: false,
    error: { code: "INVALID_TOKEN", message: "重設連結無效或已過期" },
  },
});

// POST /api/auth/reset-password/verify（只檢查，不會用掉 token）
export async function verifyResetToken(token) {
  await wait(DELAY_MS);
  if (token === "demo-valid" || token === "demo-expire-on-submit") {
    return { status: 204, body: null };
  }
  return INVALID_TOKEN();
}

// POST /api/auth/reset-password
export async function resetPassword(token) {
  await wait(DELAY_MS);
  if (token === "demo-valid") return { status: 204, body: null };
  return INVALID_TOKEN();
}
