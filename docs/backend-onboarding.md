# 後端與資料庫上手指南

這份指南讓組員在自己的電腦上啟動 API、資料庫和 E 管理後台。資料庫是本機開發資料庫，不會因為下載 GitHub 專案就連到別人的電腦；每位組員都要建立自己的 `.env`、本機資料庫和管理員帳號。

各模組共用的正式路由與欄位請以[API 契約 v1](api-contract.md)為準；本指南著重本機環境設定和操作流程。

## 從課程概念接到本專案

我查看了課程資料夾中的 `NodeJS.pdf` 和 `F2E05-API 串接.pdf`。教材大綱涵蓋 Node.js runtime、HTTP server 與路由、REST 的 GET／POST／PUT／DELETE、JSON、fetch／axios、Callback、Promise、async／await、錯誤處理、CORS、json-server、JWT 和 Postman。這可以當成組員共同接觸過的概念起點，但不能據此判定每個人都已熟練。

| 課程接觸過的概念 | 在本專案的對應 | 本指南會補上的部分 |
| --- | --- | --- |
| HTTP、REST 路由和 JSON | Express API 接收請求並回傳 JSON | 路由檔案、共用回應格式和 API 契約 |
| fetch／axios、Promise、async／await | React 透過 `src/services/api.js` 呼叫 API | session cookie、登入狀態和如何讀懂錯誤回應 |
| Node.js server、路由和 Postman | 本機啟動 Express，檢查 API | `.env`、啟動順序、health check 和端到端操作 |
| JWT 認證範例 | 本專案也需要登入保護 | 本專案使用伺服器端 cookie session，不使用 JWT |

我查看的這兩份教材大綱沒有 SQL、PostgreSQL 或 migration，因此後面會從資料庫連線、資料表、關聯、SQL 查詢和 migration 的基本用途開始說明。前端不直接連資料庫，而是呼叫 Express API。

```mermaid
flowchart LR
  UI[React 管理後台] -->|/api 請求| Vite[Vite 開發代理]
  Vite --> API[Express 路由與驗證]
  API --> Pool[共用 PostgreSQL pool]
  Pool --> DB[(本機 PostgreSQL)]
```

## 1. 建立本機 PostgreSQL 資料庫

目前開發基線是 PostgreSQL 17。先啟動本機 PostgreSQL，再用有建立角色和資料庫權限的帳號開啟 `psql`：

```bash
psql postgres
```

如果尚未建立專案角色和資料庫，在 `psql` 中執行以下指令，並將密碼改成自己的本機密碼：

```sql
CREATE ROLE skill_tree_app LOGIN PASSWORD '<本機自訂密碼>';
CREATE DATABASE skill_tree_dev OWNER skill_tree_app;
```

接著輸入 `\q` 離開。若角色或資料庫已存在，不要重複建立；使用既有設定即可。

複製環境範例，編輯 `backend/.env` 的 `DATABASE_URL`：

```bash
cp backend/.env.example backend/.env
```

預設連接埠是 `5432`。例如：

```text
DATABASE_URL=postgresql://skill_tree_app:<本機自訂密碼>@127.0.0.1:5432/skill_tree_dev
```

正式環境要把 `DATABASE_URL` 設為低權限執行帳號，把 `DATABASE_MIGRATION_URL` 設為只供部署／帳號建立的遷移帳號；正式環境還必須開啟 `DATABASE_SSL=true`。角色 SQL 與部署步驟請依[安全檢查與部署規則](security-review.md)執行。

如果 PostgreSQL 在其他連接埠，請把 `5432` 換成實際值。若密碼含 URI 保留字，需先做 URL encoding。`.env` 不會提交到 Git，請勿把密碼放進 PR、程式碼或截圖。

## 2. 安裝套件、建立 schema 和示範資料

在專案根目錄執行：

```bash
npm ci
npm --prefix backend ci
npm run db:migrate
npm run db:seed
npm run admin:create -- your_name owner
```

`db:migrate` 依序套用尚未執行的 migration；重跑時已套用的檔案會略過。`db:seed` 載入本機示範分類、技能和題目，不會建立共用帳密。`admin:create` 會在終端機隱藏密碼輸入；密碼需 12 到 72 個字，包含英文字母和數字。每位組員使用自己的本機密碼。

PostgreSQL 17 是本機開發基線。資料庫名稱、連接埠、migration 執行情況和示範資料筆數會依各組員的本機設定而不同；本機資料和本機登入帳號不會隨 PR 分享。

## 3. 啟動 API 和前端

開兩個終端機，都在專案根目錄執行：

```bash
# 終端機 1：Express API
npm run dev:api
```

```bash
# 終端機 2：React + Vite
npm run dev
```

前端會透過 Vite 將 `/api` 轉送到 `http://127.0.0.1:3000`。瀏覽器使用 Vite 顯示的網址開啟 `/admin`；預設常見網址是 `http://localhost:5173/admin`。若連接埠被占用，Vite 會改用其他連接埠。使用非預設連接埠時，請確認 `backend/.env` 的 `APP_ORIGINS` 包含實際前端網址。

確認 API 和資料庫都在線：

```bash
curl -i http://127.0.0.1:3000/api/health
```

成功回應為 HTTP 200，內容包含 `"status":"ok"` 和 `"database":"connected"`。接著登入 `/admin`，使用剛才在本機建立的管理員帳號。

## 4. 驗收管理後台與共用服務

1. E01 首頁應顯示資料庫中的題目數、分類分布和最近更新。
2. E02 題庫列表可用題目文字或編號搜尋，並依分類、狀態篩選。
3. E03 新增一筆草稿，選擇「多選」，建立四個選項，為每個選項填寫解析並標記至少兩個正解，儲存後會寫進 PostgreSQL。
4. E04 應讀回剛才儲存的作答方式、所有選項、每個選項解析、正確答案、整題解析和更新時間。
5. 從 E04 編輯題目，切換單選／多選並增刪選項後再次儲存，確認新內容回讀成功。題庫支援 2 到 10 個選項。
6. 從 E02 軟刪除測試題目；刪除會設定 `deleted_at`，不是直接刪掉資料列。

也可以用 `psql` 查看非刪除題目。連接埠和帳號請換成自己的設定：

```bash
psql -h 127.0.0.1 -p 5432 -U skill_tree_app -d skill_tree_dev
```

```sql
SELECT id, prompt, status, answer_mode, correct_choices,
       choices, choice_explanations, explanation, updated_at
FROM questions
WHERE deleted_at IS NULL
ORDER BY updated_at DESC;
```

草稿的 `active` 會是 `false`，所以查詢題庫時應用 `deleted_at IS NULL` 排除已刪除項目，不要只用 `active = true`，否則會漏掉草稿。

題庫 API 的正式欄位為 `answerMode`、`choices`、`choiceExplanations` 和 `correctChoices`。選項索引從 0 開始；單選題使用一個正確索引，多選題使用至少兩個。測驗模組 C 讀取 `correctChoices` 判定作答，使用 `selectedChoices` 保存使用者選取的索引；舊欄位 `correctChoice`／`selectedChoice` 僅為單選相容欄位。API 成功和錯誤 envelope、HTTP 狀態碼與錯誤欄位格式請依[API 契約](api-contract.md)使用。

`GET /api/skills` 提供公開技能目錄；以 `skillId` 作為技能識別欄位，並回傳 `catalogVersion`、分類、學習項目、座標和 `prerequisiteSkillIds`。`GET /api/progress` 需登入，回傳同一組 `skillId` 值作為 `completedSkillIds`，B 負責依完成狀態呈現節點，D 負責進度統計。

會員個人資料和 onboarding 使用 `GET /api/me` 與 `PATCH /api/me/profile`；兩者都以 `sid` session 決定會員身份。新註冊建立後寄送歡迎信，不寄 Email 驗證信。忘記密碼使用 `POST /api/auth/forgot-password`，不論 Email 是否註冊都回傳相同訊息；已註冊帳號會收到六位數驗證碼。重設頁以 Email、驗證碼及新密碼呼叫 `POST /api/auth/reset-password`；驗證碼 10 分鐘有效、成功使用一次，最多允許 5 次錯誤輸入，成功後撤銷該會員所有 sessions。`POST /api/auth/reset-password/verify` 可先檢查碼但不消耗它。

C 的測驗路由應在伺服器內呼叫 E 提供的題庫資料服務及 `recordSkillCompletion()`；不要把正解送進瀏覽器，也不要新增可由用戶端指定 `userId` 的完成紀錄 API。C 首版的每個 MVP 技能至少需要 5 道正式發布、非示範、未刪除、三選一單選的題目，可用 `npm run db:question-coverage` 查看一般題數和 C 可用題數。正式技能清單與課程題由 B/C 確認提供。

## 5. API 路由與共同格式

### 用 API Explorer 試 API

確認 PostgreSQL、API 和前端 Vite 都已啟動後，開啟 http://localhost:5173/api/docs。此頁使用 Skill Tree 自訂的 API Explorer；端點清單、參數及範例直接讀取 OpenAPI，不使用 Swagger UI 預設畫面。同一份機器可讀規格可從 http://localhost:5173/api/openapi.json 取得；規格原始檔為 [backend/openapi.json](../backend/openapi.json)。

1. 點右上角「檢查 API」，確認 HTTP 200 且資料庫為 connected。
2. 從左側搜尋或分類選端點；右側可填路徑／查詢參數與 JSON 本文，按「送出請求」後查看實際狀態、耗時、headers 和 response body。
3. 試會員流程時先選 POST /api/auth/login；試後台流程時先選 POST /api/admin/auth/login。成功後瀏覽器會自動保存 HttpOnly cookie，後續呼叫會自動附上，不要手動複製或輸入 cookie。
4. 從只讀 API 開始，例如 GET /api/me、GET /api/skills、GET /api/admin/members 或 GET /api/admin/questions。密碼重設需要本機信箱服務寄來的六位數驗證碼；若本機 SMTP 未設定，API 終端機會顯示測試寄送內容。
5. POST /api/admin/questions、PUT、DELETE 以及會員停權／恢復會變更資料；請使用自己的本機開發資料庫和測試帳號，不要對共用或正式資料執行。

題庫管理 API 會回傳正解，僅供管理員使用；不要把該回應當成學生作答 API。C 的建立／讀題 routes 在 PR #93，尚未接入此 E branch 的共用 Express；答案提交與結算 routes 也仍待 C 完成。會員可用 `GET /api/skills/{skillId}/quiz-availability` 檢查先修狀態和合格題數；建立測驗時 C 的 POST 仍須在 transaction 內重驗。題庫查詢、完成紀錄和 XP Outbox services 是 backend-only，不開成通用瀏覽器寫入端點。會員的 `GET /api/progress/history?skillId=...` 已納入 Explorer，讀取已完成測驗的學習歷史投影。建立測驗時，新的操作使用新 UUID `Idempotency-Key`；網路結果不確定時，重試要沿用同一 key 和同一 `skillId`，詳見[操作說明](idempotency-key-guide.md)。各模組採用的共用欄位、身份和資料責任仍以[API 契約](api-contract.md)為準。

本機還提供只讀的[前後端開發工作台](http://localhost:5173/workbench)：它會顯示 API/資料庫健康狀態、OpenAPI 端點、migration 套用清單，以及固定白名單內的程式碼。若要實際呼叫 API，使用 `/api/docs`；工作台不會建立或修改資料。

| 用途 | 路由 |
| --- | --- |
| API 與資料庫健康狀態 | `GET /api/health` |
| 管理員登入、session、登出 | `POST /api/admin/auth/login`、`GET /api/admin/me`、`POST /api/admin/auth/logout` |
| 題庫摘要、技能選項、搜尋和分頁 | `GET /api/admin/questions/summary`、`GET /api/admin/questions/options`、`GET /api/admin/questions` |
| 題目建立、詳情、編輯、軟刪除 | `POST /api/admin/questions`、`GET /api/admin/questions/:id`、`PUT /api/admin/questions/:id`、`DELETE /api/admin/questions/:id` |
| A09 會員列表、搜尋和分頁 | `GET /api/admin/members` |
| A10 會員詳情與狀態 | `GET /api/admin/members/:id`、`POST /api/admin/members/:id/suspend`、`POST /api/admin/members/:id/restore` |
| 會員個人資料、onboarding | `GET /api/me`、`PATCH /api/me/profile` |
| 會員學習歷史 | `GET /api/progress/history` |
| 忘記密碼與重設密碼 | `POST /api/auth/forgot-password`、`POST /api/auth/reset-password/verify`、`POST /api/auth/reset-password`；使用六位數驗證碼 |
| 會員學習進度讀取 | `GET /api/progress` |

成功回應格式：

```json
{ "success": true, "data": {} }
```

錯誤回應會放在 `error`，包含 `code`、`message` 和 `requestId`；欄位錯誤另附 `error.fields`。BIGINT ID 以字串傳送，時間使用 UTC ISO 8601。管理員 session 由 cookie 傳送，前端請使用共用 `apiRequest()`，它已設定 `credentials: "include"`。

## 6. 新增或整合一個後端模組

1. 先寫清楚路由、登入身分、請求欄位、回應欄位、錯誤和資料表責任；跟相關組員確認共享欄位和未定規則。
2. schema 有變動時先查看 `backend/migrations/` 和 `schema_migrations` 中已套用的最高編號，再新增下一個編號的 migration。不要修改已套用的 migration；修改後須驗證乾淨資料庫套用和同資料庫重跑。
3. 使用 `backend/src/db/pool.js` 的共用 pool。SQL 一律用參數 `$1`、`$2` 傳值；多表寫入用 transaction，並在錯誤時 rollback。
4. 驗證登入和輸入欄位後再執行 SQL。只把 middleware 掛在需要保護的路由，不要在掛載於 `/api` 的 router 上使用會攔截所有路徑的全域認證 middleware。
5. 把前端呼叫放在 `src/services/`，使用共用 `apiRequest()`；React 元件不直接連資料庫。
6. 隔離測試請設定 `TEST_DATABASE_URL` 指向名稱含有 `test` 的專用資料庫，再執行 `npm run test:api`。例如先在 `psql` 建立 `CREATE DATABASE skill_tree_test OWNER skill_tree_app;`，再使用 `TEST_DATABASE_URL='postgresql://skill_tree_app:URL_ENCODED_PASSWORD@127.0.0.1:5432/skill_tree_test' npm run test:api`。測試會在該資料庫套用 migrations 兩次、建立和清除測試資料；實際連線只使用 `TEST_DATABASE_URL`，並拒絕它與 `DATABASE_URL` 指向同一資料庫。另跑 `npm run build`、變更檔案 lint、`git diff --check` 和 API health check，並在 PR 清楚標記尚未接入真實 B/C/D 服務的契約替身測試。

目前的主要資料關係：

```mermaid
erDiagram
  SKILL_CATEGORIES ||--o{ SKILLS : contains
  SKILLS ||--o{ QUESTIONS : tests
  USERS ||--|| MEMBER_PROFILES : has
  USERS ||--o{ MEMBER_SESSIONS : signs_in
  USERS ||--o{ QUIZ_ATTEMPTS : takes
  QUIZ_ATTEMPTS ||--o{ QUIZ_ATTEMPT_QUESTIONS : contains
  USERS ||--o{ USER_SKILL_COMPLETIONS : completes
  ADMIN_ACCOUNTS ||--o{ ADMIN_SESSIONS : signs_in
  ADMIN_ACCOUNTS ||--o{ ADMIN_AUDIT_LOG : records
```

## 7. 跨模組目前待對齊事項

- A08 與 E 共用管理員登入和 session 的方式需由組內確認。
- A09/A10 的管理員 API 已提供會員搜尋、詳情、角色、等級、Google 綁定狀態、XP、進度和停權／恢復資料；Google OAuth 尚未串接，等級計算規則仍待確認。
- C 負責測驗開始、作答、評分和測驗歷史 API；題目服務、完成紀錄及首通 XP event writer 只在伺服器內呼叫。D 的學習歷史 API route 已提供，先由完成測驗 view 呈現活動；正式目錄、題庫內容和 C/D 畫面串接仍需各組提供並驗收。

## 常見問題

- `DATABASE_UNAVAILABLE`：確認 PostgreSQL 正在執行、`DATABASE_URL` 的主機／連接埠／資料庫／帳密正確，並重跑 `npm run db:migrate`。
- `ADMIN_UNAUTHENTICATED`：先用本機管理員帳號登入 `/admin`；若尚未建立最高管理者，執行 `npm run admin:create -- <你的帳號> owner`。
- `ORIGIN_NOT_ALLOWED`：將瀏覽器實際使用的前端網址加入 `APP_ORIGINS`，再重啟 API。
- Node 套件錯誤：根目錄和 `backend` 各有一份 lockfile，兩邊都要分別執行 `npm ci`。
