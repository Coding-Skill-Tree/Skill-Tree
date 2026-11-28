// 第一階段的假 API：模擬後端的回應格式（團隊 API 信封 success / data / error），
// 讓畫面的各種狀態都能看到。之後串 API 時，只要把這個函式換成 fetch，
// 回傳一樣的 { status, body } 即可，頁面不用改。
// 重設密碼的假 API 放在 src/page/reset_pwd/utils/fakeResetApi.js。

const DELAY_MS = 600;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// POST /api/auth/forgot-password
export async function requestPasswordReset(_email) {
  await wait(DELAY_MS);
  // Match the shared API: do not reveal whether an email has an account.
  return { status: 200, body: { success: true, data: null } };
}
