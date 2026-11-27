// 第一階段的假 API：模擬後端的回應格式（團隊 API 信封 success / data / error），
// 讓畫面的各種狀態都能看到。之後串 API 時，只要把這兩個函式換成 fetch，
// 回傳一樣的 { status, body } 即可，頁面不用改。

const DELAY_MS = 600;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const INVALID_CODE = () => ({
  status: 400,
  body: {
    success: false,
    error: { code: "INVALID_OR_EXPIRED_CODE", message: "驗證碼無效、已過期或已達輸入次數上限" },
  },
});

// POST /api/auth/reset-password/verify（demo-only code: 004219）
export async function verifyResetCode(email, code) {
  await wait(DELAY_MS);
  if (email === "demo@example.com" && code === "004219") return { status: 204, body: null };
  return INVALID_CODE();
}

// POST /api/auth/reset-password
export async function resetPassword(email, code) {
  await wait(DELAY_MS);
  if (email === "demo@example.com" && code === "004219") return { status: 204, body: null };
  return INVALID_CODE();
}
