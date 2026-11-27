# Skill Tree 團隊後端整合與驗收手冊

> **文件狀態：**依 2026-11-27 可讀取的遠端 GitHub 狀態和 `update/e-admin-db-contract` PR 候選版本整理。
>
> **版本核對：**團隊 `main` 為 `2a65e35`；本文件涵蓋本分支上的 E 後端工作。實際 review 版本以 GitHub PR 顯示的 head SHA 為準。
>
> **適用對象：**A、B、C、D、E 組員，以及第一次使用本專案的組員。
> **使用順序：**先看「版本與完成狀態」，再依「快速開始」啟動服務，最後按模組流程串接和驗收。

## 1. 先確認大家拿到的是同一個版本

### 1.1 GitHub 與本機目前不相同

截至 2026-11-27 可讀取的遠端狀態，團隊 repo [Coding-Skill-Tree/Skill-Tree](https://github.com/Coding-Skill-Tree/Skill-Tree) 的 `main` 為 `2a65e35`。先前的 [E 管理後台與 API 契約 PR #40](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/40)、[多選題 PR #80](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/80) 和 [C 答案解析 PR #83](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/83) 已合併；P2-E-01～07 [Issues #71–77](https://github.com/Coding-Skill-Tree/Skill-Tree/issues/71) 仍開啟。遠端還有 [B 技能樹 PR #84](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/84)、[PageHeader PR #85](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/85)、[C 測驗建立／取題 PR #86](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/86) 和 [Auth 結構 PR #87](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/87) 尚未合併。

目前 GitHub 將 #84 標示為不可直接合併；#85、#86、#87 和本 PR #88 標示為可合併。#85 和 #87 都新增 `src/page/shared-components/PageHeader.jsx`，目前兩份內容相同；也都新增 `src/assets/avatar-icon.png`。本 PR 候選沒有修改這兩個路徑。#84 仍與本 PR 在 B demo 的 `src/page/practice/module-b-demo/src/App.jsx` 有衝突，合併前需由 B 與 E 一起處理。以上為查詢當時的 GitHub 狀態，不代表後續合併或 review 結果。A–D 的 P2 工作 [Issues #44–70](https://github.com/Coding-Skill-Tree/Skill-Tree/issues/44) 仍在進行。

PR 候選分支為 `update/e-admin-db-contract`，已整合團隊 `main` 的目前版本，也已提交本分支的程式、文件和圖片。GitHub `main` 尚未包含本文件所述的 E 後端增補。

本 PR 候選的重點包含：

- `backend/migrations/010_learning_history_and_idempotency.sql`
- `GET /api/progress/history` 的學習歷史 API 與資料庫 view
- XP 首通事件 enqueue 服務與 Outbox lease 欄位
- `backend/openapi.json`、`backend/docs-ui/` 與 API Explorer
- 開發模式的 `/acceptance` 驗收頁面
- 後端路由、整合測試與 `docs/` 契約文件的工作樹修改

近期遠端進度會影響整合順序：

- PR #86 仍以 `main` 為基底且尚未合併。本分支已採用並依共用契約改寫其 `POST /api/quizzes/attempts` 和 `GET /api/quizzes/attempts/:attemptId`；答案提交、結算、測驗歷史及 XP 消費仍未完成。
- 對齊時已補上 `skill_title_snapshot`、`Idempotency-Key` 與 SHA-256 fingerprint，使用 5 題門檻和 2–10 選項的單／多選題庫，移除未共享的靜態教材狀態 gate，並避免重考時刪除舊 attempt。取題與讀取 routes 都不回正解或解析。
- PR #86 的 `server.js` 是自行建立 Express app；本專案使用 `app.js` app factory 和 `server.js` launcher，因此 routes 已註冊到共用 `app.js`。原始 C branch 的 `server.js` 不應直接覆蓋本分支。本分支和 PR #84 在 `src/page/practice/module-b-demo/src/App.jsx` 仍有 modify/delete 衝突；PR #85、#87 的新增檔案路徑未被本 PR 候選修改，且兩個 PR 的 `PageHeader.jsx` 內容相同。
- PR #86 和本分支的行為差異、遺留決策及 route 清單列在[測驗 API 整合紀錄](quiz-api-integration.md)。

因此：

1. 若你是從 GitHub `main` clone，請先使用 GitHub 上已合併的功能。PR #85–#87 的內容尚未進入 `main`。
2. 若要一起驗收本手冊描述的 E 後端，請先切到 PR 顯示的 head SHA，確認所有組員用相同版本。
3. 標記 PR Ready 前，請 C review 已移植的建立／取題 routes 與上述行為差異；另需和 B 解決 PR #84 的前端衝突，不要假設分支可以直接互相合併。

### 1.2 共同工作狀態表

下表把 GitHub issue／PR 狀態、已存在的本機服務和仍待模組串接的工作分開。**程式有服務或資料表，不等於模組端到端已驗收，也不代表 issue 已完成。**

| 模組 | GitHub 上可確認的狀態 | 本機後端可供整合的內容 | 仍需完成／驗收 |
| --- | --- | --- | --- |
| A | 登入／註冊畫面 PR #79 已合併；P2-A-01～06 仍開啟。個人資料 PR #81 已關閉但未合併。 | 會員註冊、Email 驗證、登入／登出、session、個人資料及管理員查閱會員 API。 | 依正式 A 畫面逐一接 API，驗證 Email、onboarding、登入保護及失敗提示。 |
| B | P2-B-01～07 仍開啟。技能樹 PR #84 仍是 Draft，學習歷史互動是模擬資料。 | `GET /api/skills`、`GET /api/progress`、`GET /api/progress/history`。 | 使用 B 的正式 `skillId` 目錄及會員進度；解決本分支和 PR #84 在 `module-b-demo/src/App.jsx` 的 modify/delete 衝突，再驗收畫面。 |
| C | C 修正 PR #83 已合併；PR #86 尚未合併。P2-C-01～07 仍開啟。 | 題庫 backend service、正式題數檢查、`recordSkillCompletion()`、首次 XP event enqueue，以及本分支的測驗建立／取題 routes。 | 答案提交、結算、測驗歷史 HTTP routes 和 XP 消費尚未完成；C 應 review 本分支依 migration 010 與 API 契約改寫的 routes。 |
| D | 儀表板切版 PR #39 已合併；P2-D-01～07 仍開啟。 | 本機 migration 有 `xp_outbox`、`xp_ledger` 及 lease 欄位；本機有首通 XP event enqueue 服務。 | 尚無 D 的 XP 消費 worker／發獎規則完整實作。D 需定義 claim、lease 確認／失敗、重試、入帳與等級規則，再和 C 做真實流程驗收。 |
| E | 管理後台 PR #40、題庫多選 PR #80 已合併；P2-E-01～07 仍開啟。 | 本 PR 候選包含 Express、PostgreSQL migrations、登入 session、題庫與會員管理 API、共用回應格式、測試 runner、API Explorer 和學習歷史 API。 | 使用獨立測試 DB；完成 PostgreSQL major version 決策、正式 B 題庫資料及 A/B/C/D 真實串接驗收後，才更新 issue 完成狀態。 |

### 1.3 這是每個人自己的本機服務

下方流程會讓每位組員在自己的電腦上啟動一份 API 和一份 PostgreSQL 資料庫。Vite 會把瀏覽器的 `/api` 請求轉送至該組員自己的 `127.0.0.1:3000`。**目前文件沒有設定部署中的團隊共用 API 或共用資料庫**；同一組員以外的人不會自動連到你的本機資料。

若要大家連到同一個遠端 API／資料庫，需另行部署後端、設定遠端 PostgreSQL、網域、TLS、密鑰和資料庫權限，這不在本機啟動步驟內。開發期間請用各自的本機 DB，不要把個人 `.env`、密碼、cookie 或資料庫 dump 傳進 GitHub。

## 2. 架構圖與各層分工

![Skill Tree 共用後端與跨模組整合狀態](images/backend-architecture.svg)

```mermaid
flowchart LR
  Browser[瀏覽器／React] -->|同源 /api| Vite[Vite :5173]
  Vite -->|proxy| API[Express API :3000]
  API -->|pg pool| DB[(個人本機 PostgreSQL 17)]
  API --> Skills[技能目錄與會員進度]
  API --> Admin[管理員與題庫 API]
  C[C 測驗建立／取題：本分支已整合] --> QB[題庫 backend service]
  C -. 作答／結算／歷史待實作 .-> Completion[recordSkillCompletion]
  C -. 首次通過 .-> Outbox[XP Outbox enqueue]
  D[D XP worker：待整合] -. claim／入帳 .-> Outbox
```

- **前端**透過 `src/services/api.js` 呼叫 API，不直接連 PostgreSQL。
- **Express** 驗證輸入與 session、執行業務流程、用參數化 SQL 存取資料。
- **PostgreSQL** 由 migrations 建 schema；`db:seed` 只放開發展示資料。
- **API Explorer** 讀取同一份 OpenAPI 規格，適合不先寫前端就逐支檢查 API。
- **C／D 內部服務**只能由可信任的後端程式呼叫。不要讓瀏覽器直接讀正確答案或寫入任意 `userId`。

常用資料表依序分為：會員與登入（`users`、`member_profiles`、`member_sessions`、`email_tokens`）、技能目錄（`skill_categories`、`skills`、`skill_prerequisites`）、題庫與測驗（`questions`、`quiz_attempts`、`quiz_attempt_questions`）、進度（`user_skill_completions`、`user_progress_revisions`、本機版歷史 view）、XP（`xp_outbox`、`xp_ledger`）及 migration 紀錄（`schema_migrations`）。完整欄位和資料責任見 [`docs/database-schema.md`](database-schema.md)；路由欄位和錯誤格式見 [`docs/api-contract.md`](api-contract.md)。

## 3. 開始前要安裝的工具

請在 VS Code 開啟專案資料夾，再選「Terminal → New Terminal」。也可使用 macOS Terminal、Windows PowerShell 或其他終端機；指令要在專案根目錄（可看到根目錄 `package.json` 的資料夾）執行。

| 工具 | 版本／用途 | 確認方式 |
| --- | --- | --- |
| Git | 複製和更新 repo | `git --version` |
| Node.js | 使用版本 24；根目錄 `.nvmrc` 是 `24`，後端限制 `>=24 <25` | `node --version` 應顯示 `v24.x` |
| npm | 隨 Node.js 安裝 | `npm --version` |
| PostgreSQL | 本機開發基線 PostgreSQL 17 | `psql --version`，或用 Docker PostgreSQL 17 |
| VS Code | 編輯程式和開整合終端機 | 選用；也可使用其他編輯器 |
| Docker Desktop | 可選，適合不想手動安裝 PostgreSQL 的組員 | `docker --version` |

建議使用 Node 版本管理工具安裝 Node 24；也可由 [Node.js 官方下載頁](https://nodejs.org/en/download)安裝 24.x。若安裝了 `nvm`，在專案根目錄執行：

```bash
nvm install 24
nvm use 24
node --version
```

Windows 可使用 nvm-windows 或直接安裝 Node.js 24.x。切換 Node 後關閉並重開 VS Code 終端機，再確認 `node --version` 是 24.x。

若要使用 Docker 建 PostgreSQL，請先安裝並啟動 [Docker Desktop](https://www.docker.com/products/docker-desktop/)；macOS 和 Windows 都可使用。若不裝 Docker，改用 PostgreSQL 17 安裝服務也可以。

## 4. 取得正確版本的專案

### 4.1 從目前團隊 GitHub `main` 開始

若只要取得目前已合併版本：

```bash
git clone https://github.com/Coding-Skill-Tree/Skill-Tree.git
cd Skill-Tree
git switch main
git pull origin main
git rev-parse --short HEAD
```

Windows PowerShell 也可以逐行執行相同指令。VS Code 使用者可選 **File → Open Folder**，開啟剛 clone 的 `Skill-Tree` 資料夾。

### 4.2 使用本手冊所描述的本機最新版

本機 HEAD 和工作樹目前都還沒完整上 GitHub。請先向負責人確認「這份最新版已推到哪個 repo／branch、包含哪些 commit SHA」，再依對方提供的分支切換；不要猜分支名稱，也不要把本機私人 `.env` 複製進共享分支。

拿到分支名稱後，將下方 `branch-provided-by-owner` 換成負責人提供的實際分支名稱：

```bash
git fetch origin
git switch --track origin/branch-provided-by-owner
git rev-parse --short HEAD
```

所有組員應先比對 `git rev-parse --short HEAD`，確認 SHA 完全相同再回報啟動或測試結果。若分支不在 `origin`，請使用負責人提供的遠端名稱或 repo URL。

## 5. 建立本機 PostgreSQL 17

資料庫只保存該組員的本機資料。可用 Docker，或使用已安裝的 PostgreSQL。

### 方法 A：Docker Desktop（建議給剛開始的組員）

先啟動 Docker Desktop，再在終端機執行以下單行指令。這會建立名為 `skill-tree-postgres` 的容器和持久化資料 volume；資料庫只綁定本機 loopback 位址：

```bash
docker volume create skill-tree-postgres-data
docker run --name skill-tree-postgres --env POSTGRES_USER=skill_tree_app --env POSTGRES_PASSWORD=replace_locally --env POSTGRES_DB=skill_tree_dev --publish 127.0.0.1:5432:5432 --volume skill-tree-postgres-data:/var/lib/postgresql/data --detach postgres:17
```

若出現容器已存在，啟動既有容器即可：

```bash
docker start skill-tree-postgres
```

確認 PostgreSQL 已準備好接受連線：

```bash
docker exec skill-tree-postgres pg_isready -U skill_tree_app -d skill_tree_dev
```

成功時會看到 `accepting connections`。這組 `replace_locally` 是本機開發範例密碼，只能用於自己電腦的開發 DB；若想更換，請同步修改 `backend/.env` 中的 `DATABASE_URL`。

### 方法 B：自己安裝的 PostgreSQL

確認 PostgreSQL 17 服務已啟動，使用有建立角色／資料庫權限的管理者建立本機帳號與資料庫：

```sql
CREATE ROLE skill_tree_app LOGIN PASSWORD '請換成自己的本機密碼';
CREATE DATABASE skill_tree_dev OWNER skill_tree_app;
```

這段 SQL 可在 `psql`、pgAdmin 或其他 PostgreSQL GUI 工具的 SQL 視窗執行。若角色或 DB 已存在，不要重複建立；請使用現有帳號。含有 `@`、`/`、`:` 等 URI 保留字的密碼要做 URL encoding 後再放進連線網址。

## 6. 設定環境變數與安裝套件

以下命令在專案根目錄執行。

macOS／Linux／Git Bash：

```bash
cp backend/.env.example backend/.env
npm ci
npm --prefix backend ci
```

Windows PowerShell：

```powershell
Copy-Item backend/.env.example backend/.env
npm ci
npm --prefix backend ci
```

用 VS Code 開啟 `backend/.env`，依本機資料庫修改至少以下兩行：

```dotenv
DATABASE_URL=postgresql://skill_tree_app:replace_locally@127.0.0.1:5432/skill_tree_dev
PUBLIC_APP_URL=http://localhost:5173
```

Docker 範例資料庫的預設帳密可直接使用第一行。若用自己安裝的 PostgreSQL，請將使用者、密碼、主機、連接埠和 DB 名稱換成自己建立的值。若 Vite 顯示前端使用 5174 或其他連接埠，請將 `PUBLIC_APP_URL` 設為畫面顯示的實際網址；`APP_ORIGINS` 也必須包含該網址。**不要把 `backend/.env` 提交或貼到群組。**

`npm ci` 必須執行兩次：第一次安裝根目錄前端套件，第二次安裝 `backend/` 的 API 套件。根目錄 `npm ci` 不會安裝 Express 或 PostgreSQL client。

## 7. 建立資料庫結構、展示資料與管理員

保持在專案根目錄，依序執行：

```bash
npm run db:migrate
npm run db:seed
npm run admin:create -- team-admin
```

1. `db:migrate` 依序套用未執行的 SQL migration。重跑時會略過已套用且 checksum 相同的檔案；不要修改已套用的 migration，schema 變更要新增下一個序號。
2. `db:seed` 載入本機展示分類、技能和示範題。示範題有 `is_demo=true`，不算正式題目覆蓋率；不要把展示資料當成正式課程內容。
3. `admin:create` 的 `team-admin` 是本機後台帳號名稱，可改成自己喜歡的 3–32 字英數字／底線帳號。命令會要求輸入密碼，密碼不會顯示；需 12–72 字並同時包含英文字母和數字。

若指令回報 `DATABASE_URL` 或連線錯誤，先確認 PostgreSQL 正在執行及 `backend/.env` 的主機、連接埠、資料庫名稱和帳密，再重跑 migration。**不要在共享／正式資料庫試跑 `db:seed` 或管理員建立命令。**

## 8. 啟動 API 與前端

在 VS Code 開兩個終端機視窗，兩個都要位於專案根目錄。

**終端機 1：啟動 Express API**

```bash
npm run dev:api
```

API 預設監聽 `http://127.0.0.1:3000`。此終端機保持開啟；若環境設定錯誤，錯誤訊息會顯示在這裡。

**終端機 2：啟動 React／Vite**

```bash
npm run dev
```

使用 Vite 終端機顯示的 `Local` 網址，通常是 `http://localhost:5173/`。管理後台路徑是 `/admin`；互動式 API 文件是 `/api/docs`；本機驗收頁是 `/acceptance`。Vite 會把 `/api` 代理到 Express `3000` port，所以前端和 API 都必須保持啟動。

若 port 被占用，Vite 會顯示新 port。此時將該網址加入 `backend/.env` 的 `APP_ORIGINS`，並同步更新 `PUBLIC_APP_URL`，再重啟 API。

## 9. 用最短流程確認服務可用

先確認 health endpoint：

macOS／Linux／Git Bash：

```bash
curl -i http://127.0.0.1:3000/api/health
```

Windows PowerShell：

```powershell
curl.exe -i http://127.0.0.1:3000/api/health
```

成功條件：HTTP `200`，JSON 顯示 API 狀態 `ok` 和資料庫 `connected`。接著瀏覽器依序開啟：

1. `http://localhost:5173/api/docs`：API Explorer。
2. `http://localhost:5173/admin`：後台登入與題庫／會員管理。
3. `http://localhost:5173/acceptance`：本機版逐步驗收頁；此頁只在 Vite 開發模式存在。

瀏覽器如果使用不同的 Vite port，請以終端機顯示的網址替換 `5173`。

## 10. 使用 API Explorer、Postman 或前端呼叫

### 10.1 API Explorer（建議第一次使用）

1. 先啟動 PostgreSQL、API 和 Vite。
2. 開啟 `http://localhost:5173/api/docs`。
3. 點「檢查 API」，確認 health 回應成功、資料庫 connected。
4. 選一支 endpoint，填寫 path/query/body 欄位，再按「送出請求」。右側可查看實際 HTTP 狀態、headers 和 JSON body。
5. 先測唯讀 endpoint：`GET /api/health`、`GET /api/skills`、登入後的 `GET /api/me` 或 `GET /api/progress`。
6. 再測寫入 endpoint。新增／編輯／刪除題目或停權會員會改動自己的本機 DB；先確認瀏覽器連的是本機 Vite 網址。

API Explorer 和瀏覽器會保留 HttpOnly session cookie。登入成功後再次選登入保護的 API 即可，不要將 cookie 貼到 PR、issue、截圖或訊息。

### 10.2 Postman

1. 建立環境變數 `baseUrl = http://127.0.0.1:3000`。
2. 先送 `GET {{baseUrl}}/api/health`，確認 HTTP 200 和資料庫連線。
3. 建立會員／管理員登入請求時，使用下表的 JSON 格式；在 Postman 開啟 cookie jar，讓後續請求自動帶上 API 設定的 cookie。
4. 若收到 `ORIGIN_NOT_ALLOWED`，先改用同源 API Explorer；也可在 Postman request 設定 `Origin` 為 `backend/.env` `APP_ORIGINS` 中的一個前端 origin，例如 `http://localhost:5173`。
5. `POST`、`PATCH`、`PUT`、`DELETE` 測試只對自己本機的開發資料庫執行。

會員登入 body 範例：

```json
{
  "email": "your-local-test@example.test",
  "password": "使用本機註冊時設定的密碼"
}
```

管理員登入 body 範例：

```json
{
  "username": "team-admin",
  "password": "admin:create 時設定的本機密碼"
}
```

### 10.3 統一回應格式

成功：

```json
{ "success": true, "data": {} }
```

錯誤：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "表單內容有誤",
    "requestId": "...",
    "fields": { "email": "請輸入有效的 Email" }
  }
}
```

`fields` 只會在欄位錯誤時出現。通常 `400` 是輸入錯誤、`401` 是尚未登入、`403` 是沒有權限、`404` 是資料不存在、`409` 是資料衝突、`503` 是 DB 暫時無法使用。BIGINT ID 以字串傳回，時間是 UTC ISO 8601。

前端請沿用 `src/services/api.js` 的 `apiRequest()`，不要每個元件自行 `fetch`、重做錯誤解析或漏掉 `credentials: 'include'`。API JSON 欄位請依 `docs/api-contract.md`，資料表和 migration 責任請依 `docs/database-schema.md`；實際已實作路由可在 OpenAPI 文件查看。

### 10.4 Endpoint 快速索引

| 身份 | 方法與路由 | 用途 |
| --- | --- | --- |
| 公開 | `GET /api/health`、`GET /api/skills` | 檢查服務；讀取啟用的技能目錄。 |
| 會員登入前 | `POST /api/auth/register`、`POST /api/auth/verify-email`、`POST /api/auth/login`、`POST /api/auth/forgot-password`、`POST /api/auth/reset-password/verify`、`POST /api/auth/reset-password` | 註冊、驗證、登入和密碼重設。 |
| 會員 session | `POST /api/auth/logout`、`POST /api/auth/change-password`、`GET /api/me`、`PATCH /api/me/profile`、`GET /api/progress`、本機版 `GET /api/progress/history` | 會員本人操作／查詢；以 session cookie 決定身份。 |
| 管理員登入前／session | `POST /api/admin/auth/login`、`GET /api/admin/me`、`POST /api/admin/auth/logout` | 獨立管理員登入狀態；管理員帳號由 `admin:create` 命令建立。 |
| 管理員 session | `/api/admin/questions`、`/api/admin/members` | 題庫 CRUD、搜尋與摘要；會員查詢、詳情、停權／恢復。需管理員 session。 |
| 會員 session | `POST /api/quizzes/attempts`、`GET /api/quizzes/attempts/:attemptId` | 建立五題測驗及讀取本人題目快照；不回正解或解析。答案提交、結算與測驗歷史 routes 待實作。 |

## 11. 組員依模組接線的步驟

### A：會員註冊、登入、個人資料

1. 用 `POST /api/auth/register` 建立自己的測試會員。只用自己可控制的測試 Email。
2. 預設 `.env.example` 沒有 SMTP 設定；API 終端機會輸出本機驗證連結。複製連結到瀏覽器完成 `POST /api/auth/verify-email` 流程，再用 `POST /api/auth/login` 登入。
3. 瀏覽器登入後，session cookie 由伺服器設定；以 `GET /api/me` 讀取目前會員。
4. 以 `PATCH /api/me/profile` 儲存暱稱、頭像、學習路線或 onboarding 欄位。會員 ID 由 cookie 決定，不能在 request body 指定要改哪位會員。
5. 用 `POST /api/auth/logout` 登出，之後呼叫受保護的 `GET /api/me` 應回 `401`。
6. 忘記密碼：呼叫 `POST /api/auth/forgot-password`；本機無 SMTP 時在 API 終端機找重設連結，再依序呼叫 verify 與 reset endpoint。

### B：技能目錄、技能狀態和學習歷史

1. 在 client adapter 呼叫 `GET /api/skills`，讀取 `catalogVersion`、`categories` 和 `skills`。
2. 節點 key 一律採用正式 `skillId`，不要用 title、陣列位置或另造 `skillNodeId`。
3. 登入會員後呼叫 `GET /api/progress`。以相同的 `skillId` 比對 `completedSkillIds`，並依 B 的解鎖規則顯示節點狀態。
4. 若要顯示測驗活動，在本機最新版呼叫 `GET /api/progress/history?limit=20`。有 `nextCursor` 時用它取得下一頁；沒有記錄可能是 C 尚未寫入真實完成測驗。
5. 把資料載入、loading、空狀態、401/錯誤狀態都接到實際畫面，再以至少一筆登入會員的完成紀錄驗收。
6. 不要把 `catalogVersion` 當技能 ID；正式課程目錄、分類排序和節點座標仍要跟 B 對齊。

### C：測驗流程、答案判定與首次完成

本分支已接入建立測驗和題目快照讀取 routes；答案提交、結算和測驗歷史 routes 尚待完成。C 可在共用 Express app 延伸路由，並在後端匯入服務：

```js
import { listPublishedQuestionsForSkill } from '../services/question-bank.js';
import { recordSkillCompletion } from '../services/progress-service.js';
import { enqueueSkillFirstPassXpEvent } from '../services/xp-outbox.js';
```

串接時依序處理：

1. 測驗 routes 使用 `requireMember`；會員身份由 session cookie 決定，不接受 client 傳入 `userId`。
2. `POST /api/quizzes/attempts` 驗證 active skill、先修條件及題庫最低題數，再由 `listPublishedQuestionsForSkill(database, skillId)` 取已發布、啟用、未軟刪除、非 demo 題。此服務包含答案索引，**只供可信任的後端判分，絕不能把 `correctChoices` 回傳瀏覽器**。
3. 建立測驗會快照題目、選項、技能名稱和答案，採用 `Idempotency-Key`，資料表以 `(user_id, idempotency_key)` 保護建立重送。依目前 API 契約抽 5 題；新 attempt 不刪除先前未完成 attempt。
4. `GET /api/quizzes/attempts/:attemptId` 只允許同一會員讀取；即使 attempt 還在進行中，也不會回正解或解析欄位。
5. 待實作的答案 routes 應用登入 session 限定 attempt 所屬會員；結算時伺服器用快照答案重新判分，不相信前端分數。
6. 只有 `passed=true` 的完成 attempt 才可在同一 DB transaction 內呼叫 `recordSkillCompletion(database, { userId, skillId, attemptId })`。它會拒絕不屬於該會員／技能或未通過的 attempt；同技能重考不重複新增完成紀錄。
7. 讀取 `recordSkillCompletion()` 的回傳值；只有 `newlyCompleted === true` 時，才在同一 transaction 呼叫 `enqueueSkillFirstPassXpEvent(database, { userId, skillId, attemptId })`。回滾時 attempt 結果、完成狀態、revision 和 XP event 要一起回滾。
   ```js
   const completion = await recordSkillCompletion(client, { userId, skillId, attemptId });
   if (completion.newlyCompleted) {
     await enqueueSkillFirstPassXpEvent(client, { userId, skillId, attemptId });
   }
   ```
8. 用 `GET /api/progress` 和 `GET /api/progress/history` 驗證 B、D 所讀到的結果；確認連續重送不會重複計分、完成紀錄或 XP event。

建立或擴充 route 時，請在 `backend/src/app.js` 註冊共用 router；`backend/src/server.js` 只負責啟動既有 app，不要另建第二個 Express instance。

目前建立／取題 endpoints 可由 C 前端使用；答案提交／結算／歷史 endpoints 尚待完成。尚未接上的畫面需明確標示 mock 資料；不可將管理員題庫 API 當成會員測驗 API。

### D：XP、等級、成就和儀表板

1. 先與 C 定義 XP event payload 和事件來源。首通事件目前固定為 `source_type=quiz_attempt`、`source_id=attemptId`、`event_type=skill.first_pass`；payload 使用 `skillId`、`attemptId`、`catalogVersion`、`completedAt`。
2. D 定義各事件的獎勵值、等級門檻和成就規則；新 Outbox event 的 `amount` 是 `NULL`，獎勵計算屬 D，不要由 C 在 request body 指定。
3. 在後端新增 worker/service 以 transaction claim `pending` 或已過期的工作、使用 lease token 防止舊 worker 回覆覆蓋新 worker，再以 `xp_ledger.event_id` 唯一限制避免重複加分。
4. 成功入帳和將 event 標記完成要在同一 transaction；失敗需排定重試時間，到達限制後留在 failed 狀態供檢查。
5. 更新儀表板 API 和畫面後，以 C 完成一次技能測驗為起點驗收：首通只有一次 XP，重考不重發；歷史、等級和分類完成率一致。

目前本機只有 `enqueueSkillFirstPassXpEvent()` enqueue 服務和資料表 lease 欄位；沒有完整的 D worker、等級規則或成就系統。不要把資料表存在描述成發獎流程已完成。

### E：共用後端、題庫與資料庫

1. 新增 API 前，先在 `docs/api-contract.md` 補端點、身份、body、response、error 和資料責任，再與呼叫端組員確認。
2. Schema 變更新增下一個 migration 檔案；不改已套用的 SQL。使用 `npm run db:migrate` 後，再在獨立乾淨 DB 驗證首次和重複套用。
3. 路由放在 `backend/src/routes/`，共用驗證／session middleware、`src/db/pool.js` 和 `lib/api-response.js`；SQL 用 `$1` 參數，不串接使用者輸入。
4. 更新 `backend/openapi.json` 和 API Explorer，讓組員能在 `/api/docs` 查到已實作的 endpoint 和例子。
5. 後端答案服務只給 C 的 server-side route 使用；管理員題庫 API 有正解欄位，需 `requireAdmin` 保護。
6. 執行獨立測試 DB 的 API tests，再做前端 build、diff check 和健康檢查；PR 說明清楚標註是 API shape/mock、DB integration，還是真正 A–D 的 end-to-end 驗收。

## 12. 在資料庫 GUI 或 `psql` 檢查資料

可用 `psql`、pgAdmin、DBeaver、TablePlus 等工具連到**自己的**本機 DB：

| 欄位 | Docker 範例 |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `5432` |
| Database | `skill_tree_dev` |
| Username | `skill_tree_app` |
| Password | `backend/.env` 的密碼 |

命令列連線：

```bash
psql -h 127.0.0.1 -p 5432 -U skill_tree_app -d skill_tree_dev
```

在 `psql` 提示符下可執行：

```sql
-- 已套用的 migration
SELECT filename, applied_at FROM schema_migrations ORDER BY filename;

-- 啟用的分類與技能
SELECT c.name AS category, s.id AS skill_id, s.title, s.catalog_version
FROM skills s
JOIN skill_categories c ON c.id = s.category_id
WHERE c.active AND s.active
ORDER BY c.sort_order, s.sort_order;

-- 題目狀態和展示題標記
SELECT id, skill_id, status, active, is_demo, deleted_at
FROM questions
ORDER BY id;
```

結束 `psql` 輸入 `\q`。不要手動更新 migration checksum、直接寫入會員密碼或刪掉 attempt 快照來讓驗收看起來通過。

## 13. 執行安全的驗收

### 13.1 題庫覆蓋率

```bash
npm run db:question-coverage
```

它會逐一檢查 active skill 是否至少有 5 道正式發布、非展示、未刪除題目。若 `ready=false`，先把結果交給 B/C 補正式題目；展示 seed 不算通過。不要為了讓數字變綠而把 demo 題當正式題。

### 13.2 API 整合測試（必須使用 test DB）

1. 建立另一個獨立資料庫 `skill_tree_test`，不要把 `skill_tree_dev` 當測試 DB。
   Docker 範例可執行 `docker exec skill-tree-postgres psql -U skill_tree_app -d postgres -c "CREATE DATABASE skill_tree_test OWNER skill_tree_app;"`。若資料庫已存在，直接使用它；原生 PostgreSQL 請由有 `CREATEDB` 權限的管理者建立。
2. 在 `backend/.env` 加入 `TEST_DATABASE_URL`，指到這個 test DB；可沿用開發帳號，但 DB 名稱必須含有 `test` 字詞。

```dotenv
TEST_DATABASE_URL=postgresql://skill_tree_app:replace_locally@127.0.0.1:5432/skill_tree_test
```

3. 在專案根目錄執行：

```bash
npm run test:api
```

runner 只使用 `TEST_DATABASE_URL`，拒絕指向 `DATABASE_URL` 同一 DB，也會拒絕名稱沒有獨立 `test` 字詞的 DB。它會套用 migrations 兩次並建立／清理測試紀錄，不會 drop 整個資料庫。仍需自己先確認 URL 指向的是專用測試 DB。

### 13.3 前端和程式碼檢查

```bash
npm run build
npm run lint
git diff --check
```

實作模組時另在 PR 記錄：用哪個 commit、跑過哪些指令、API 回應、瀏覽器流程，還有哪些內容只用 mock。API response 範例、錯誤碼和驗收責任依 `docs/api-contract.md`、`docs/database-schema.md` 與相關 GitHub issue 對齊。

## 14. 常見問題排除

| 現象 | 優先檢查 |
| --- | --- |
| `ECONNREFUSED`／`DATABASE_UNAVAILABLE` | Docker／PostgreSQL 是否啟動；`DATABASE_URL` host、port、DB、帳密是否一致；再重跑 migration。 |
| migration 說 checksum 不一致 | 不要改 `schema_migrations` 或重寫舊 migration；檢查分支是否混用，再以新的 migration 修正。 |
| `/api/health` 200 但前端不能呼叫 API | 前端和 API 是否都啟動；網址是否是 Vite 顯示的 port；`APP_ORIGINS` 是否包含該 origin。 |
| `ORIGIN_NOT_ALLOWED` | 在 `APP_ORIGINS` 加入瀏覽器實際網址後重啟 API；測試時優先用 Vite proxy／API Explorer。 |
| `ADMIN_UNAUTHENTICATED` | 以自己的 `admin:create` 帳號登入 `/admin`，確認是 API Explorer 使用的同一個瀏覽器 origin。 |
| 會員登入回 `INVALID_CREDENTIALS` | 確認 Email 已驗證、帳號未停權、密碼正確；無 SMTP 時從 API 終端機找本機驗證連結。 |
| progress API 回 401 | 先完成會員登入並保留該瀏覽器的 session cookie。 |
| `/api/progress/history` 為空 | C 還沒建立／結算真實測驗，或 DB 沒有已完成 attempt；demo seed 不會產生會員歷史。 |
| 題庫覆蓋率不是 ready | 檢查正式發布題數；demo、草稿、停用和軟刪除題不計入覆蓋率。 |
| `npm ci` 版本或 engine 錯誤 | 切換至 Node 24.x，刪除舊終端機並開新終端機後再安裝。 |
| 註冊／重設連結開錯 port | 將 `PUBLIC_APP_URL` 改成實際 Vite 網址，重啟 API 後重新申請連結。 |

## 15. 組員回報格式

每次串接或驗收完，請在對應 GitHub issue／PR 用以下格式回報，讓其他模組知道可重現的版本和未完成項：

```text
模組／Issue：
測試的 commit SHA：
本機環境：Node 24.x、PostgreSQL 17、OS：
已執行：migration / seed / health / API / UI / integration test
通過結果：
未通過或尚未測：
Mock 或替身範圍：
需要其他模組協助：
```

只有實際資料庫和對應模組完成端對端驗收後，才回報「整合完成」。文件、API contract、mock 畫面或單元測試單獨通過，都不等於整個功能已交付。
