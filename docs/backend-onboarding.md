# 後端與資料庫上手指南

這份指南讓組員在自己的電腦上啟動 API、資料庫和 E 管理後台。資料庫是本機開發資料庫，不會因為下載 GitHub 專案就連到別人的電腦；每位組員都要建立自己的 `.env`、本機資料庫和管理員帳號。

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

如果 PostgreSQL 在其他連接埠，請把 `5432` 換成實際值。這台開發電腦使用 `5433`。若密碼含 URI 保留字，需先做 URL encoding。`.env` 不會提交到 Git，請勿把密碼放進 PR、程式碼或截圖。

## 2. 安裝套件、建立 schema 和示範資料

在專案根目錄執行：

```bash
npm ci
npm --prefix backend ci
npm run db:migrate
npm run db:seed
npm run admin:create -- test
```

`db:migrate` 依序套用尚未執行的 migration；重跑時已套用的檔案會略過。`db:seed` 載入本機示範分類、技能和題目，不會建立共用帳密。`admin:create` 會在終端機隱藏密碼輸入；密碼需 12 到 72 個字，包含英文字母和數字。每位組員使用自己的本機密碼。

目前這台電腦的 `skill_tree_dev` 使用 PostgreSQL 17.12、連接埠 5433，migration 001 到 007 已套用，示範資料為 6 個分類、15 個技能和 8 道題目。這些本機資料和本機登入帳號不會隨 PR 分享；組員各自跑 migration 和 seed 後會得到相同的起始結構與示範資料。

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

## 4. 用畫面走一次 E01 到 E04

1. E01 首頁應顯示資料庫中的題目數、分類分布和最近更新。
2. E02 題庫列表可用題目文字或編號搜尋，並依分類、狀態篩選。
3. E03 新增一筆草稿，儲存後會寫進 PostgreSQL。
4. E04 應讀回剛才儲存的題目、選項、正解、解析和更新時間。
5. 從 E04 編輯題目並再次儲存，確認新內容回讀成功。
6. 從 E02 軟刪除測試題目；刪除會設定 `deleted_at`，不是直接刪掉資料列。

也可以用 `psql` 查看非刪除題目。連接埠和帳號請換成自己的設定：

```bash
psql -h 127.0.0.1 -p 5432 -U skill_tree_app -d skill_tree_dev
```

```sql
SELECT id, prompt, status, correct_choice, updated_at
FROM questions
WHERE deleted_at IS NULL
ORDER BY updated_at DESC;
```

草稿的 `active` 會是 `false`，所以查詢題庫時應用 `deleted_at IS NULL` 排除已刪除項目，不要只用 `active = true`，否則會漏掉草稿。

## 5. API 路由與共同格式

| 用途 | 路由 |
| --- | --- |
| API 與資料庫健康狀態 | `GET /api/health` |
| 管理員登入、session、登出 | `POST /api/admin/auth/login`、`GET /api/admin/me`、`POST /api/admin/auth/logout` |
| 題庫摘要、技能選項、搜尋和分頁 | `GET /api/admin/questions/summary`、`GET /api/admin/questions/options`、`GET /api/admin/questions` |
| 題目建立、詳情、編輯、軟刪除 | `POST /api/admin/questions`、`GET /api/admin/questions/:id`、`PUT /api/admin/questions/:id`、`DELETE /api/admin/questions/:id` |
| A09 會員列表、搜尋和分頁 | `GET /api/admin/members` |
| A10 會員詳情與狀態 | `GET /api/admin/members/:id`、`POST /api/admin/members/:id/suspend`、`POST /api/admin/members/:id/restore` |
| 會員學習進度讀取 | `GET /api/progress` |

成功回應格式：

```json
{ "success": true, "data": {} }
```

錯誤回應會放在 `error`，包含 `code`、`message` 和 `requestId`；欄位錯誤可能另附 `details.fields`。BIGINT ID 以字串傳送，時間使用 UTC ISO 8601。管理員 session 由 cookie 傳送，前端請使用共用 `apiRequest()`，它已設定 `credentials: "include"`。

## 6. 新增或整合一個後端模組

1. 先寫清楚路由、登入身分、請求欄位、回應欄位、錯誤和資料表責任；跟相關組員確認共享欄位和未定規則。
2. schema 有變動時新增下一個編號的 migration，例如目前最新是 `007`，下一個用 `008_description.sql`。不要修改已套用的 migration。
3. 使用 `backend/src/db/pool.js` 的共用 pool。SQL 一律用參數 `$1`、`$2` 傳值；多表寫入用 transaction，並在錯誤時 rollback。
4. 驗證登入和輸入欄位後再執行 SQL。只把 middleware 掛在需要保護的路由，不要在掛載於 `/api` 的 router 上使用會攔截所有路徑的全域認證 middleware。
5. 把前端呼叫放在 `src/services/`，使用共用 `apiRequest()`；React 元件不直接連資料庫。
6. 本機先跑 migration、health check、建立／讀取／更新／刪除流程，再把實際測試結果和待整合欄位寫在 PR。測試資料完成後清除或軟刪除；integration 之前不要把 Issues 標成 Done。

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
- C 負責測驗開始、作答、評分和歷史 API；E 提供 `GET /api/progress`。整合前要確認完成狀態、題目 ID 和進度欄位。

## 常見問題

- `DATABASE_UNAVAILABLE`：確認 PostgreSQL 正在執行、`DATABASE_URL` 的主機／連接埠／資料庫／帳密正確，並重跑 `npm run db:migrate`。
- `ADMIN_UNAUTHENTICATED`：先用本機管理員帳號登入 `/admin`；若本機尚無管理員，執行 `npm run admin:create -- <帳號>`。
- `ORIGIN_NOT_ALLOWED`：將瀏覽器實際使用的前端網址加入 `APP_ORIGINS`，再重啟 API。
- Node 套件錯誤：根目錄和 `backend` 各有一份 lockfile，兩邊都要分別執行 `npm ci`。
