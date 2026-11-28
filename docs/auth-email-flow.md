# 會員註冊與密碼重設流程

這份文件描述 A 畫面與 E 共用後端目前採用的 Email 流程。新註冊不要求 Email 驗證；忘記密碼會寄一次性六位數驗證碼。流程圖：[會員 Email 流程圖](images/auth-email-flow.svg)。

## 註冊

1. 前端以 `POST /api/auth/register` 傳送 `{ "email", "password" }`。
2. 後端在同一個 PostgreSQL transaction 建立會員、profile 和登入 session，commit 後設定 HttpOnly `sid` cookie。
3. 後端在建立 user 時直接設定 `email_verified_at = now()`，不寄 Email 驗證連結；成功回 `201`，`data.nextStep` 為 `/onboarding`。前端直接導向角色建立頁，不需先登入或等候驗證信。
4. 後端另寄歡迎信；若 SMTP 暫時失敗，帳號與 session 仍有效，註冊仍回成功。

> 這是小組目前要求的測試流程：方便 A 建立會員後直接進下一個環節，但並沒有驗證註冊者控制該信箱。若用於公開服務或真實會員資料，應先恢復信箱驗證或加入等效的所有權確認；不要把 `email_verified_at` 當成使用者真的收過驗證信。

最小驗收方式：用同源 API Explorer 在 `POST /api/auth/register` 建立專用測試帳號；同一瀏覽器接著呼叫 `GET /api/me`，應回相同 `userId` 且 `onboardingCompleted: false`；再呼叫 `PATCH /api/me/profile` 建立暱稱和角色，應回 `onboardingCompleted: true`。不要把 session cookie 複製到 issue、文件或截圖。

## 忘記密碼

1. 前端以 `POST /api/auth/forgot-password` 傳送 `{ "email" }`。
2. 不論帳號是否存在，後端都回相同成功訊息，避免洩漏會員名單。
3. 若帳號存在且寄送節流允許，後端建立六位數隨機碼並寄到該 Email。郵件連結不帶 Email 或驗證碼，使用者在頁面手動輸入，避免把會員 Email 放進 URL。開發環境未設定 SMTP 時，測試郵件內容會印在 API 終端機；production 必須設定 SMTP。
4. 使用者輸入 Email、驗證碼及新密碼。前端先做格式檢查，直接呼叫 reset 即可；`/verify` endpoint 是可選的預先檢查。

## API 契約

| 操作 | Request | 成功結果 |
| --- | --- | --- |
| 申請驗證碼 | `POST /api/auth/forgot-password` `{email}` | `200` 通用訊息，不透露 Email 是否註冊 |
| 預先檢查（可選） | `POST /api/auth/reset-password/verify` `{email,code}` | `204`；成功檢查不會消耗驗證碼 |
| 完成重設 | `POST /api/auth/reset-password` `{email,code,password}` | `204`；驗證碼消耗，撤銷該會員全部 session |

`code` 一律是字串，格式 `^[0-9]{6}$`。例如 `004219` 必須保留前導零。無效、過期、已使用或輸入次數用盡時，回 `400 INVALID_OR_EXPIRED_CODE`。密碼欄位錯誤也使用 `400` 與標準 error envelope。

## 防濫用與資料保護

- 驗證碼以 `crypto.randomInt()` 產生，保留六位數與前導零；資料庫只存 HMAC-SHA-256 摘要，摘要綁定會員 ID。production 必須在 secret store 設定至少 32 字元的 `EMAIL_CODE_SECRET`。
- 驗證碼 10 分鐘到期、只能成功使用一次；每個碼最多接受 5 次錯誤輸入。申請重設每個 Email 至少間隔 60 秒。
- 發出新碼會使該會員舊的未使用密碼重設碼失效。忘記密碼 endpoint 對已註冊及未註冊 Email 使用相同 response。
- Migration 012 會使既有長 token 密碼重設連結失效；發布後，持有舊連結的會員需要重新申請六位數碼。舊未驗證會員仍可用成功的重設流程完成驗證時間補寫。
- 成功更新密碼後，後端刪除該會員所有 session，瀏覽器 cookie 也會清除。
- 郵件傳送失敗只記錄 request ID 和錯誤訊息，不記錄驗證碼；development 的本機 SMTP 替代輸出例外，僅供本機使用，不能部署到 production。

期限、錯誤次數、寄送節流和欄位呈現是 E 的安全實作值；A 可在 review 確認畫面及使用者提示，若需調整期限或限制，請先同步 API 契約和 migration。

## 前端串接位置

- 共用呼叫函式：`src/services/memberAuth.js` 的 `requestPasswordReset()`、`verifyResetCode()`、`resetPassword()`。
- 註冊／登入 adapter：`registerMember()`、`loginMember()`；註冊頁成功後直接導向 `/onboarding`。
- 頁面：`src/page/member/register/RegisterPage.jsx`、`src/page/member/login/LoginPage.jsx`、`src/page/member/onboarding/CharacterCreatePage.jsx`、忘記／重設密碼頁。
- API 欄位與錯誤格式：[`docs/api-contract.md`](api-contract.md) 與 [`backend/openapi.json`](../backend/openapi.json)。

> 舊的 `/api/auth/verify-email` 及 `{token}` 密碼重設契約保留為相容程式碼或歷史文件的過渡項目，不是新會員流程；目前 API 契約以 `{email,code}` 為準。
