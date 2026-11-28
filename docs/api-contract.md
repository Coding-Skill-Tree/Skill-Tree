# Skill Tree API 契約 v1

這份文件是 A、B、C、D、E 共用的 API 對齊基準。路由以目前 Express 後端為準；沒有標示「已實作」的端點不得由前端假設存在。

互動式 API Explorer：啟動本機前端及 API 後開啟 [API Explorer](http://localhost:5173/api/docs)；機器可讀的 OpenAPI 3.0 定義在 [backend/openapi.json](../backend/openapi.json)，非 production 環境提供 `/api/openapi.json`。Explorer 直接讀取 OpenAPI，不另維護第二份路由清單；production 不提供 Explorer 或 OpenAPI HTTP 路由。E 此分支已掛載共用學習歷史查詢及測驗可用性查詢；C 的建立／讀題 API 在 PR #93，尚未掛到 E app；答案提交與測驗結果也尚未提供。題庫寫入和會員停權等 Explorer 操作會修改資料，請只連本機測試資料庫。

## 共通規則

- API base path：`/api`。請求與回應使用 UTF-8 JSON；`204 No Content` 不含回應本文。
- 成功回應：`{ "success": true, "data": ... }`。
- 錯誤回應：`{ "success": false, "error": { "code": "...", "message": "...", "requestId": "...", "fields": { "field": "原因" } } }`。沒有欄位錯誤時省略 `fields`。
- HTTP 狀態：`200` 查詢／更新成功、`201` 建立成功、`204` 無本文成功、`400` 請求或欄位無效、`401` 未登入、`403` 權限不足／帳號停權、`404` 資源不存在、`409` 資料衝突、`413` 本文過大、`429` 登入嘗試過多、`503` 資料庫或相依服務暫時無法使用。
- `BIGINT` ID 與可能超過 JavaScript 安全整數的累計數值一律用十進位字串；一般計數、頁碼、等級和布林值用 JSON number／boolean。時間為 UTC ISO 8601 字串。
- 頁碼從 1 開始。搜尋關鍵字會 trim，使用不分大小寫的字面子字串比對，不把 `%`、`_` 當萬用字元。
- 瀏覽器呼叫需帶 cookie（`credentials: "include"`）。管理員 cookie 名稱為 `admin_sid`，會員 cookie 為 `sid`；兩者皆 HttpOnly、SameSite=Lax，正式環境使用 Secure。前端不得自行傳入可信任的 `userId` 來代表登入身分。
- 寫入 API 僅接受 allowlist 中的同源請求。不要把 cookie token、密碼、驗證 token 或完整的 session 資料寫入 log。
- `APP_ORIGINS` 是精確 origin allowlist，不可含路徑；production 必須明確設定且只能使用 HTTPS origin。server 啟動時會驗證連接埠、pool 大小、session TTL、登入節流值及來源網址。

## 健康檢查與資料庫

### `GET /api/health`（已實作）

不需登入。API 與資料庫可用時回傳 `200`：

```json
{ "success": true, "data": { "status": "ok", "database": "connected" } }
```

資料庫無法連線時回傳 `503 DATABASE_UNAVAILABLE`。

Schema 以 `backend/migrations/` 中有序遞增且不可回改的 SQL migrations 為唯一來源，目前為 001–012。每位組員使用獨立本機資料庫；migration runner 會鎖定、檢查 checksum，並以 transaction 套用單一 migration。開發基線為 PostgreSQL 17；團隊仍需確認共用 PostgreSQL major version。

目前的資料責任對照如下；C、D 的業務規則和寫入流程由該模組負責人確認，E 維護共用 Schema 與 migration，不替其他模組決定業務邏輯。

| Tables | 資料責任 | 對齊事項 |
| --- | --- | --- |
| `users`, `member_profiles`, `member_sessions`, `email_tokens` | 會員帳號、個人檔案、驗證與 session | A 確認會員欄位；E 維護共用身份 Schema |
| `admin_accounts`, `admin_sessions`, `admin_audit_log`, `auth_rate_limits` | 後台身份、session、管理操作紀錄與登入節流 | E 維護，管理操作需可追溯 |
| `skill_categories`, `skills`, `skill_prerequisites` | 技能目錄、節點、座標與先修關係 | B 確認正式目錄 ID、排序和版本 |
| `questions` | 題庫與管理員維護 | E 提供 CRUD 與資料契約；C 確認測驗取用格式 |
| `quiz_attempts`, `quiz_attempt_questions` | 測驗流程、題目快照、作答與結果 | C 確認測驗狀態和保存欄位；E 維護共用 migration |
| `user_skill_completions`, `user_progress_revisions` | 永久通過狀態及會員進度版本 | C 在通過測驗時呼叫共用 completion service；首次插入才遞增 revision |
| `user_learning_activity_history` | 已完成測驗的學習歷史唯讀投影 | D 的歷史 API 讀 view；不複製 C 的 quiz attempts |
| `xp_outbox`, `xp_ledger` | 首通事件與實際 XP 發放帳本 | C 僅在首通時產生事件；D 定義金額、消費和重試 |

## A：會員與管理員

### 會員登入服務

| Method | Path | 認證 | 用途 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | 無 | 同交易建立會員、profile、session；`{email,password}`，成功 `201` 設定 `sid` 並回 `nextStep: "/onboarding"` |
| POST | `/api/auth/verify-email` | 無 | 舊版 Email 驗證連結相容端點；新註冊不再寄送驗證連結 |
| POST | `/api/auth/login` | 無 | 登入；`{email,password}`，建立 `sid` cookie |
| POST | `/api/auth/logout` | `sid` 可有可無 | 撤銷目前會員 session，回 `204` |
| GET | `/api/me` | 會員 | 讀取目前登入會員資料 |
| POST | `/api/auth/forgot-password` | 無 | 申請密碼重設；對已註冊與未註冊 Email 使用相同訊息 |
| POST | `/api/auth/reset-password/verify` | 無 | `{email,code}`；檢查六位數驗證碼但不消耗，成功 `204` |
| POST | `/api/auth/reset-password` | 無 | `{email,code,password}`；驗證碼一次性使用，回 `204` 並撤銷既有 sessions |
| POST | `/api/auth/change-password` | 會員 | `{currentPassword,newPassword}`；回 `204`，撤銷其他 sessions |
| PATCH | `/api/me/profile` | 會員 | `{username,avatarId}`；更新目前會員 onboarding profile，成功回傳會員資料 |

會員識別一律來自驗證過的 `sid`。新註冊會在建立 user/profile 的同一個 transaction 建立登入 session，成功回應後即可呼叫會員 API 並接續 `/onboarding`；不寄驗證信，另寄歡迎信。舊的未驗證帳號仍可透過成功的密碼重設流程補上 Email 驗證時間。停權帳號不可登入或使用會員 API。密碼只保存雜湊，session token 只以雜湊保存。

忘記密碼回應不揭露 Email 是否註冊；寄送節流為每個 Email 60 秒一次。驗證碼以密鑰 HMAC 儲存，不保存明碼；有效期限 10 分鐘、成功重設後即消耗，每個驗證碼最多 5 次錯誤輸入。production 必須在 secret store 設定至少 32 字元的 `EMAIL_CODE_SECRET`。期限、嘗試次數與寄送節流是 E 的安全實作值，A 可在 review 提出一致性調整。

`POST /api/auth/login` 與 `GET /api/me` 的會員資料欄位一致：`userId`（字串）、`username`（即會員暱稱，可為 `null`）、`email`、`createdAt`、`avatarId`、`route`、`onboardingCompleted`、`hasPassword`。`userId`、`username` 對齊 A 模組第一階段會員 profile API；不要另外建立 `id`／`nickname` 別名。

### A-08 管理員登入

| Method | Path | 認證 | 用途 |
| --- | --- | --- | --- |
| POST | `/api/admin/auth/login` | 無 | `{username,password}`；成功建立 `admin_sid`，回傳 `role` |
| GET | `/api/admin/me` | 管理員 | 讀取目前管理員與 `role` |
| POST | `/api/admin/auth/logout` | `admin_sid` 可有可無 | 撤銷管理員 session，回 `204` |
| GET | `/api/admin/team` | `owner` | 列出管理員帳號；不回傳密碼雜湊或會員資料 |
| PATCH | `/api/admin/team/{id}` | `owner` | `{disabled}` 停用／恢復組員；更改管理員角色只允許在可信任主機執行 |

管理員角色只有 `owner` 和 `editor`。唯一的 `owner` 是專案最高管理者；`editor` 組員可瀏覽會員和編輯題庫，但不能管理組員帳號。新管理員不提供公開註冊，需在可信任主機執行 `admin:create`。登入失敗使用一致訊息並套用帳號節流；管理員 session 與會員 session 分開保存與驗證。

登入成功與 `GET /api/admin/me` 都回傳 `{ "adminId": "1", "username": "site_admin", "role": "editor" }`。管理員 ID 也是十進位字串。

### A-09 會員列表（已實作並由共用管理後台整合）

`GET /api/admin/members?keyword={文字}&page={正整數}`，需管理員 session。`keyword` 最多 100 個字，只比對暱稱或 Email；每頁固定 20 筆，依建立時間新到舊排序。同時間以 `userId` 由大到小排序。超出最後一頁的頁碼會正規化至最後一頁；沒有結果時 `totalPages` 為 1、`items` 為空陣列。

```json
{
  "success": true,
  "data": {
    "items": [{
      "userId": "123",
      "username": "小明",
      "avatarId": "avatar-03",
      "email": "member@example.com",
      "createdAt": "2026-11-24T01:00:00.000Z",
      "suspended": false
    }],
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

尚未設定暱稱或頭像時，`username`／`avatarId` 為 `null`。列表只回傳管理介面需要的欄位，不回傳 Email 驗證 token、密碼雜湊或 session 資料。

### A-10 會員詳情與停權管理（已實作並由共用管理後台整合）

| Method | Path | 認證 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/admin/members/:userId` | 管理員 | 讀取會員基本與遊戲資料 |
| POST | `/api/admin/members/:userId/suspend` | 管理員 | 停權、撤銷該會員所有 sessions、寫入管理稽核紀錄 |
| POST | `/api/admin/members/:userId/restore` | 管理員 | 恢復登入並寫入管理稽核紀錄 |

詳情 `data` 欄位：`userId`、`username`、`avatarId`、`email`、`role`、`createdAt`、`learningRoute`、`onboardingCompleted`、`googleLinked`、`suspended`、`suspendedAt`、`xp`、`level`、`courseProgress`。`xp` 為十進位整數字串；沒有活動時是 `"0"`。`courseProgress` 每筆包含 `courseName`、`currentLevel`（已完成節點數）及 `totalLevels`（啟用節點數）。

```json
{
  "success": true,
  "data": {
    "userId": "123",
    "username": "小明",
    "avatarId": "avatar-03",
    "email": "member@example.com",
    "role": "member",
    "createdAt": "2026-11-24T01:00:00.000Z",
    "learningRoute": "beginner",
    "onboardingCompleted": true,
    "googleLinked": false,
    "suspended": false,
    "suspendedAt": null,
    "xp": "1250",
    "level": 3,
    "courseProgress": [{ "courseName": "HTML", "currentLevel": 8, "totalLevels": 15 }]
  }
}
```

停權和恢復是冪等操作：重複呼叫仍回傳目前會員詳情，不重複新增狀態變更稽核紀錄。不存在或格式錯誤的 ID 回 `404 MEMBER_NOT_FOUND`。

## B：技能目錄與會員進度

| Method | Path | 認證 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/skills` | 無 | 讀取啟用中的分類與技能目錄 |
| GET | `/api/progress` | 會員 | 讀取目前會員完成的技能及版本 |
| GET | `/api/skills/{skillId}/quiz-availability` | 會員 | 只讀取可否開始 C v1 測驗、原因、缺少的先修 ID 和合格題數；不回題目或正解 |

`GET /api/skills` 回傳 `{catalogVersion,categories,skills}`。每個 skill 的正式識別欄位為 `skillId`，並包含 `categoryId`、`category`、`title`、`description`、`learningItems`、`position:{x,y}`、`catalogVersion`、`sortOrder`、`prerequisiteSkillIds`。

`GET /api/progress` 回傳 `{catalogVersion,revision,completedSkillIds}`。`revision` 為十進位字串，首次為 `"0"`；完成清單中的 ID 與技能目錄 `skillId` 完全相同。技能目錄與進度使用同一個 active catalog version 計算方式。

B×C 在 [整合討論 #1](https://github.com/Coding-Skill-Tree/Skill-Tree/issues/1) 定案統一採 B 的 `skillId`。這是唯一公開 JSON 欄位名稱；資料庫欄位用 `skill_id`。C issue 舊文中的 `skillNodeId` 應由 C adapter 對齊此契約，不另開一套欄位。

測驗模組在伺服器 transaction 中呼叫 E 的內部 `recordSkillCompletion(database, { userId, skillId, attemptId })`。`userId` 必須取自已驗證 session，attempt 必須屬於該會員與技能且已通過。首次完成才新增紀錄並遞增 revision；重複提交不重複完成或遞增。這是 backend module interface，不是瀏覽器可呼叫的通用寫入 API。

## C：題庫與測驗資料界線

管理員題庫 CRUD 位於 `/api/admin/questions`，需管理員 session。題目資料使用 `skillId`、`answerMode`（`single`／`multiple`）、`choices`、`choiceExplanations`、`correctChoices`、`explanation`、`difficulty`、`status`。正解索引從 0 開始且不重複；單選一個、多選至少兩個；選項數量為 2–10。

管理員題庫端點會回傳正解，只能由管理員 session 呼叫。不得把管理端點改成公開端點，也不得讓瀏覽器在作答前取得正解。C 負責測驗開始、抽題、答案判定、計分與歷史；E 提供 backend-only `listPublishedQuestionsForSkill(database, skillId)`，只回傳已發布、啟用、未刪除、非展示題及其答案給可信任的伺服器程式。C 的 HTTP route 不得將正解欄位回傳給瀏覽器。

正式題庫覆蓋率以每個目標技能至少 5 道符合 C 首版規格的題目為驗收門檻：已發布、啟用、未刪除、非展示題、單選、恰好 3 個選項、恰好 1 個正解，且題目與解析完整。`npm run db:question-coverage` 同時列出一般正式題數與 C 首版可用題數；目前開發 seed 是展示題，不計入正式覆蓋率。C 的五個 MVP `skillId` 清單及 ready 標記方式尚待確認，因此不能把所有 active skill 自動當成 MVP 技能。

### C 測驗 API 與資料規則

C 的 [PR #93](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/93) 提供建立和讀取測驗 API，但目前仍未合併；E app 不重複實作 C 的 router，也不會在本分支 OpenAPI 假裝端點已掛載。migration 010、CORS `Idempotency-Key`、題庫可用性服務和 history projection 是 E 提供的整合依賴。答案提交與結算 endpoint 尚未出現在 PR #93。

| Method | Path | 認證 | 實作狀態／用途 |
| --- | --- | --- | --- |
| POST | `/api/quizzes/attempts` | 會員 | **C PR #93，尚未合併**；建立 C v1 五題測驗；body `{ skillId }`；必帶 UUID `Idempotency-Key` |
| GET | `/api/quizzes/attempts/:attemptId` | 同一會員 | **C PR #93，尚未合併**；取得本人的測驗快照；取消、不存在或非本人 attempt 回 `404 ATTEMPT_NOT_FOUND` |
| POST | `/api/quizzes/attempts/:attemptId/answers` | 同一會員 | **尚未實作**；C 擁有；預計使用 `{ ordinal, selectedChoices }`，首版只收一個選項索引 |
| GET | `/api/quizzes/attempts/:attemptId/result` | 同一會員 | **尚未實作**；完成後回成績、通過狀態、正解和解析 |
| GET | `/api/skills/{skillId}/quiz-availability` | 會員 | **E 此分支已實作**；回可用狀態、先修缺口和符合 C v1 規則的題數；不回題目或答案 |
| GET | `/api/progress/history?skillId=...` | 會員 | **E 此分支已實作**；沿用 `limit`／`cursor`，不另做 C 專用 history route |

C PR #93 的冪等結果為：第一次建題 `201`；相同會員、相同 key 和相同本文重送 `200` 並回同一 attempt；同 key 換本文回 `409 IDEMPOTENCY_KEY_CONFLICT`。原 attempt 若已取消，舊 key 重送仍回 `200` 且 `status: "cancelled"`，不重啟也不另建；讀取已取消 attempt 回 `404 ATTEMPT_NOT_FOUND`。新測驗需新 key。key 以 `(session userId, key)` 唯一，資料庫儲存本文 fingerprint；詳見[Idempotency-Key 使用說明](idempotency-key-guide.md)。

### C × E 已確認的測驗流程規則

以下整理自 [PR #88 的 C × E 規格確認](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/88#issuecomment-7212566961)。它們是流程決議；答案提交與結果 API 的完整欄位、狀態碼仍由 C 在實作前補成 API 規格。

- **題庫與 MVP：** MVP 目標為 5 個技能，每個技能至少有 5 道符合 C v1 規格的正式題目；每場隨機抽 5 題。五個正式 `skillId` 和教材 ready 的正式資料來源尚待確認；未 ready 的技能不得開始測驗。
- **題型：** C v1 只使用三選一單選題，每題固定 3 個選項和 1 個正解。E 題庫仍可保留多選與 2–10 個選項供其他用途。
- **作答鎖定與回饋：** 每題提交後不得修改；返回已答題目只能檢視，不能再次作答，必須按「下一題」繼續。提交後只回饋答對／答錯，不顯示正解或解析；五題完成後才在結算頁顯示總成績、通過狀態、每題正解及解析。
- **題目識別：** 作答用 `attemptId` + `ordinal`；ordinal 從 1 開始，必須落在該 attempt 固定的五題快照範圍內。
- **取消與重開：** 舊進行中 attempt 保留資料並標記 `cancelled`；取消的測驗不可續答、不可重啟，也不列入完成歷史。相同舊 key 仍對應原 attempt；開始新測驗必須產生新 key。PR #93 目前會取消同一會員、同一技能的舊進行中 attempt，接入共用 app 時需在整合測試確認此範圍符合最終流程。
- **完成與 XP：** C 負責 eligibility、抽題、作答及判分；E 的 completion service 維護永久通過狀態與 revision，只有首次通過才 enqueue XP Outbox。已通過技能是否允許重考仍待 C 確認。
- **歷史：** 沿用 E 的 `GET /api/progress/history`，不另建重複的 C history API。C 首次載入 10 筆，後續使用 `nextCursor`；每頁沿用相同的選填 `skillId` 篩選。

E 的 `getQuizAvailability(database, { userId, skillId })` 和 `GET /api/skills/{skillId}/quiz-availability` 檢查 active skill、會員先修完成和符合單選三選項一個正解、內容完整的正式題數；至少五題才可開始。此服務沒有教材 ready 判斷，因為目前共用 schema 沒有 lesson publication 欄位。C PR #93 的 `tutorials.js` 只有一筆 `draft` 樣本，該 gate 會擋住所有尚未列入靜態清單的技能；C/E 對齊時應改用共用服務，或先決定教材狀態的正式 schema/API 來源。建立測驗的 POST 必須在 transaction 內重做可用性檢查，不能只信任之前的 GET。

C 的讀題 route 不得回傳正解或解析；未作答時也不得回傳正確性。讀取已作答題目時可回傳會員自己的 `selectedChoices` 和 `isCorrect`，讓前端呈現本題對錯，但不得回傳正解索引或解析。正解只由 E 的 backend-only `listPublishedQuestionsForSkill()` 提供給可信任的 server code。測驗建立和讀題雖在 C PR #93 有實作，答案提交、結果結算、永久通過和 XP 事件的真實端到端流程仍待 C/E/D 對齊；PR #93 的獨立測試不是 E app 的 live DB 整合驗收。

### D／C 共用學習歷史 API（E 共用路由已實作，待模組畫面串接）

`GET /api/progress/history?limit=10&skillId=html-basics&cursor=...` 需會員 session，會員 ID 一律取自 session。`skillId` 為選填篩選；`limit` 可設 1–50，預設 20，C 初次載入 10 筆並將相同 `limit` 帶到後續頁。`cursor` 是不透明 keyset token；回傳的 `nextCursor` 需原樣帶回，且每頁沿用相同 `skillId` 篩選。response data 為 `{ items, nextCursor }`；每筆目前包含 `activityId`（等於 `attemptId`）、`activityType: "quiz_attempt"`、`skillId`、`skillTitle`、`catalogVersion`、`completedAt` 及 `result: { correctCount, totalQuestions, passed }`。無紀錄時回空 `items`，不是錯誤。取消或進行中的 attempt 不列入歷史。

成功回應範例：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "activityId": "7dc16b30-54ef-4dda-a927-36028c0a9976",
        "activityType": "quiz_attempt",
        "skillId": "html-basics",
        "skillTitle": "HTML 基礎",
        "catalogVersion": 1,
        "completedAt": "2026-11-26T02:09:08.123Z",
        "result": { "correctCount": 4, "totalQuestions": 5, "passed": true }
      }
    ],
    "nextCursor": null
  }
}
```

此 API 讀取 migration 010 的 `user_learning_activity_history` view，僅列已完成 attempt；不建立另一張測驗／學習歷史表，也不把永久通過摘要重複列成活動。使用 `completedAt DESC, activityId DESC` 的 keyset cursor，同時間的 attempt 仍有穩定順序。未來如需列出非測驗活動，由該活動的負責模組提供唯一來源，再擴充 view。

## D：XP 與遊戲資料

會員詳情中的 XP 讀取 `xp_ledger`，進度讀取 `user_skill_completions`。首次完成與 `user_progress_revisions`、首通 XP event 必須同 transaction；C 在 completion service 回傳 `newlyCompleted: true` 時呼叫 E 的 backend-only `enqueueSkillFirstPassXpEvent()`。D 從資料列讀取的事件 envelope 是 `{ eventId, userId, sourceType: \"quiz_attempt\", sourceId: attemptId, eventType: \"skill.first_pass\", payload: { skillId, attemptId, catalogVersion, completedAt } }`。它只表示「某會員首次通過某技能」；新事件的 `amount` 為 `NULL`，由 D 依規則計算並把實際金額寫入 ledger。D 以 `event_id` 和 `(source_type, source_id, event_type)` 防重，重用自然鍵但內容不同視為衝突而不是覆寫。

D worker 預期使用 `FOR UPDATE SKIP LOCKED` 搭配 `lease_token`／`lease_expires_at` claim 工作。確認或回報失敗必須帶當前 token；過期事件可重領，舊 worker 不能確認新 worker 的 lease。Migration 已提供欄位和索引，但 worker SQL 尚待 D 實作與 review。full-jitter 指數退避（5 秒起、上限 1 小時）及最多 12 次是待 D review 的候選值，尚未定案。ledger insert 和 Outbox completed 標記應在同一 DB transaction；`xp_ledger.event_id` unique 保證重試不重複入帳。

D 可先用 `GET /api/me`、`GET /api/skills`、`GET /api/progress` 和 `GET /api/progress/history` 串會員資料、目錄、完成狀態及近期測驗活動。這些 API 只透過 session 查目前會員；`GET /api/progress/history` 目前只含已完成的測驗，不含 XP 入帳明細。

P2-D-05 要求的 `GET /api/progress/achievements` 和 P2-D-06 指定的 `GET /api/progress/dashboard` 目前尚未加入 Express/OpenAPI；XP worker 的 claim／ack／fail 也不是公開 HTTP API。P2-D-01 的 XP 餘額以 `xp_ledger` 加總，管理員 API 內雖有 XP 欄位，會員端不得使用管理員身份路由。請 D 先提供 XP 等級門檻、成就資料模型、Dashboard 欄位和必要的逐筆 XP 查詢需求，再由 D/E 一起定義會員 session-scoped response 與新增 migration；不可依照尚未存在的 endpoint 開發正式 client。

## 管理後端與資料責任

- E 維護 Express、PostgreSQL migrations、共用回應／驗證、session middleware、共用資料 API 與文件；progress writer 與題庫查詢服務僅供 backend module 內部呼叫。
- A 維護會員前端流程；本管理介面的 A-09/A-10 頁面使用 `admin_sid` 和 `/api/admin/members*`。
- B 維護技能樹顯示與解鎖邏輯；E 回傳目錄及已完成 ID，不替 B 計算前端節點顯示狀態。
- C 維護測驗流程及判分；E 不把測驗流程塞進題庫管理路由。
- D 維護 XP、等級、成就和儀表板業務邏輯；E 提供共用儲存及契約。

欄位或責任需變更時，先更新本文件和對應 migration，再由 A–D 的負責人同步更新 client adapter；避免前端另造欄位名稱或依賴未寫明的回應。

## P2-E-01～07 交付對照

以下以 GitHub issue 的驗收條件對照目前程式；「程式已備妥」不代表已在共用資料庫或其他模組完成端對端驗收。Issue 狀態需在驗收完成後再更新。

| Issue | 已交付／既有基礎 | 完成狀態與下一個驗收點 |
| --- | --- | --- |
| P2-E-01 環境與服務基礎 | Express app、環境驗證、Node 24、共用 middleware 和路由已建立；CORS 預檢包含實際支援的 HTTP 方法。 | 啟動、健康檢查、設定拒絕與 graceful shutdown 由 API 整合測試驗收。 |
| P2-E-02 PostgreSQL 與共用 Schema | Migrations 001–012 定義身份、技能、題庫、測驗快照、進度、歷史投影、冪等、XP worker lease、管理員角色和重設碼嘗試次數；[Schema 概覽](database-schema.md)列出欄位、關聯和責任。 | 使用獨立 PostgreSQL 17 測試資料庫做乾淨套用、重跑、checksum 和查詢驗收；團隊仍需確認共用 PostgreSQL major version。 |
| P2-E-03 會員登入與 Session | Session 身份推導、cookie、登出、停權、六位數碼重設密碼與 `requireMember` 已實作；忘記／重設密碼畫面改用共用 API。依 A 的測試流程，新註冊直接設定 `email_verified_at` 並建立 session，不確認信箱所有權。 | 資料庫整合測試驗證直接註冊、重設碼錯誤／過期／一次性及舊 session 失效；A review 欄位及 UI 提示。若公開上線或存放真實會員資料，需恢復信箱驗證或等效保護。 |
| P2-E-04 技能目錄與進度 | `skillId` 為 B×C 已確認的標準 ID；skills/progress 共用目錄版本計算；內部 completion service 驗證通過測驗、冪等寫入並只在首次完成增加 revision。 | 使用 PostgreSQL 驗證目錄與進度一致、首次／重複完成及無效 attempt；正式技能資料由 B 提供。 |
| P2-E-05 題庫資料與維護 | 管理員 CRUD 保持受管理員 session 保護；E backend-only service 可查正式題目與正解，並提供不含題目／答案的會員可用性 API；新增題目索引 DB constraints 和每技能題庫覆蓋檢查。C PR #93 尚未改用 E service，也未掛入本 app。 | 測試驗證正解不經公開 HTTP 端點提供、展示／草稿／刪除題被排除及每個正式技能至少 5 題。正式內容由 B/C 提供；C/E 接線和共用 app DB 整合仍待驗收。 |
| P2-E-06 回應格式與驗證 | Success/error envelope、`error.fields`、request ID、狀態碼與前端 API client 統一；補上 `PUT` preflight。 | 測試驗證欄位錯誤、無效 JSON、CORS、認證錯誤與資料庫錯誤均遵守契約。 |
| P2-E-07 跨模組整合與 API 測試 | 已建立獨立 test database runner；在隔離 PostgreSQL `skill_tree_test` 執行 `npm run test:api`，migrations 001–012 乾淨套用並成功重跑，33 項 API／session／profile／progress／question bank／admin 整合測試全數通過。 | E 自有 API 與資料庫整合已驗收；B/C/D 真實服務尚未全部接入同一 app，因此端對端串接和組員驗收仍待完成。 |

## 後續功能想法收件清單

使用者在實作期間提出的新功能先記在這裡，再決定是否納入本版契約。每筆記錄補上受影響模組、API／資料表、依賴及可驗收條件；尚未確認的想法不當作已核定需求。

| ID | 提出日期 | 功能想法 | 影響範圍 | 驗收條件 | 決策狀態 |
| --- | --- | --- | --- | --- | --- |
| — | — | 等待新增 | — | — | 尚無項目 |

新想法依提出順序編號為 `FEAT-001`、`FEAT-002`……；先記原意，再補技術影響與驗收條件，不自行把建議改寫成已核定規格。
