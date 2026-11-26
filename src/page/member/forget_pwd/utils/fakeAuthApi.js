// 第一階段的假 API：模擬後端的回應格式（團隊 API 信封 success / data / error），
// 讓畫面的各種狀態都能看到。之後串 API 時，只要把這個函式換成 fetch，
// 回傳一樣的 { status, body } 即可，頁面不用改。
// 重設密碼的假 API 放在 src/page/reset_pwd/utils/fakeResetApi.js。

const DELAY_MS = 600;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fail = (status, code, message) => ({
  status,
  body: { success: false, error: { code, message } },
});

// POST /api/auth/forgot-password
export async function requestPasswordReset(email) {
  await wait(DELAY_MS);
  if (email === "nobody@example.com") {
    return fail(404, "ACCOUNT_NOT_FOUND", "此帳號尚未註冊");
  }
  if (email === "google@example.com") {
    return fail(400, "GOOGLE_ONLY_ACCOUNT", "此帳號使用 Google 註冊，請使用 Google 登入");
  }
  return { status: 200, body: { success: true, data: null } };
}
