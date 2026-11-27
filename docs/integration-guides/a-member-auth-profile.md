# A｜會員登入、註冊與個人資料

本指南列出 A 畫面目前可用的共用後端接口，以及 A/E 串接時各自負責的部分。使用自己的測試會員與本機資料庫。

## 已可呼叫的 API

| 操作 | Endpoint | Request／結果 |
| --- | --- | --- |
| 註冊 | `POST /api/auth/register` | `{email,password}`；同一 transaction 建立 user、profile、session；`201` 設定 `sid` 並回 `nextStep: "/onboarding"`，不寄驗證信 |
| 登入／登出 | `POST /api/auth/login`、`POST /api/auth/logout` | 登入成功設定 HttpOnly `sid` cookie；登出回 `204` |
| 讀會員 | `GET /api/me` | 用 `sid` 識別會員；`userId` 是字串 |
| 更新 profile | `PATCH /api/me/profile` | `{username,avatarId}`；會員 ID 由 session 決定 |
| 申請密碼重設 | `POST /api/auth/forgot-password` | `{email}`；不揭露該 Email 是否註冊，已註冊會員收六位數碼 |
| 驗證碼預檢（可選） | `POST /api/auth/reset-password/verify` | `{email,code}`；有效時 `204`，不消耗驗證碼 |
| 重設密碼 | `POST /api/auth/reset-password` | `{email,code,password}`；成功 `204`，清除該會員全部 sessions |
| 改密碼 | `POST /api/auth/change-password` | 會員 session；`{currentPassword,newPassword}`；撤銷其他 sessions |

所有 API 成功／錯誤格式、欄位和限制見[共用契約](../api-contract.md)。`code` 必須以字串傳，像 `004219` 前面的 `00` 不能被 JavaScript 轉成數字後丟掉。密碼重設碼 10 分鐘到期、錯誤 5 次後失效、申請每 Email 60 秒一次；production 需設定 `EMAIL_CODE_SECRET`。本機 SMTP 未設定時，測試信件內容會顯示在 API 終端機。

## 前端串接

使用 `src/services/memberAuth.js`，不要在元件中另外複製 fetch／錯誤解析：

```js
import { registerMember, getMe, requestPasswordReset, resetPassword } from "./services/memberAuth.js";

const member = await registerMember({ email: "member@example.test", password: "NewPassword9" });
// apiRequest 使用 credentials: include；註冊回應同時設定 HttpOnly sid cookie。
window.location.assign(member.nextStep); // /onboarding
await getMe();
await requestPasswordReset("member@example.test");
await resetPassword("member@example.test", "004219", "NewPassword9");
```

共用 API client 會攜帶 `sid` cookie 並將 API envelope 轉成 `ApiRequestError`。顯示欄位錯誤時使用 `error.fields`；不要把 `sid`、密碼或驗證碼寫入 console、分析事件或截圖。

## 資料庫責任

- E 維護 `users`、`member_profiles`、`member_sessions`、`email_tokens`、`auth_rate_limits` 的共用 schema、session middleware 和 routes。
- A 提供會員 UI 欄位與 onboarding 產品流程；若需要新的 profile 欄位，先在 API 契約提出，再由 E 新增 migration 和 API adapter。
- 前端不得直接寫 `users` 或替 request body 增加 `userId`。會員 ID 一律從經驗證的 `sid` 推導。
- Google/OAuth identity table 目前只是 schema 預留，OAuth 路由尚未實作；畫面不能把它當成已可用登入方式。

## A 需要協助確認／交付的項目

1. 對照登入、註冊、忘記密碼、重設密碼和 onboarding 畫面，確認欄位名稱、成功後導向和 loading/error/empty 狀態。正式 root routes 為 `/register`、`/login`、`/onboarding`。
2. 確認六位數碼輸入提示和期限、次數限制文字能在 A 的畫面清楚呈現；若要改限制，提出 API 契約變更。
3. 用專用 Email 測 `/register`：成功後應自動進入 `/onboarding`；確認瀏覽器已帶 `sid`，建立角色後進 `/skillmap`。不要在測試截圖或 log 顯示 cookie、密碼。
4. 註冊後直接建立登入 session；不要再要求呼叫 `/api/auth/verify-email`。舊端點只保留相容，不是新註冊流程的一部分。A 仍需 review 成功提示、重複 Email 錯誤和 onboarding 導向。
