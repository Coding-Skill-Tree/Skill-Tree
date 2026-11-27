# Skill Tree 團隊後端整合與驗收手冊

> **文件狀態：**依 2026-11-28 的遠端 GitHub、Discord 小組聊天室、專案通知郵件與 E integration PR #94 核對。私人信箱和聊天室只作為發布進度來源；本文件沒有代任何組員發訊息。
>
> **版本核對：**遠端 `main` 最新 SHA 為 `c814544`（PR #92 merge commit）。E integration 已推送至 [Draft PR #94](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/94)；分支保留 PR #90 SkillMap、PR #91 會員 UI、PR #92 dashboard／mock XP 變更。C 的 [PR #93](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/93) 仍未合併。本文件與 E 端程式碼都屬於 PR #94；請以 PR 頁面顯示的 head SHA 為準。
>
> **適用對象：**本專案五位組員 A、B、C、D、E；E 負責此 PR，跨模組協作者為 A–D。
> **使用順序：**先看「版本與完成狀態」，再依「快速開始」啟動服務，最後按模組流程串接和驗收。

## 1. 先確認大家拿到的是同一個版本

### 1.1 GitHub 與本機目前不相同

截至 2026-11-28，團隊 repo [Coding-Skill-Tree/Skill-Tree](https://github.com/Coding-Skill-Tree/Skill-Tree) 的 `main` 為 `c814544`；PR #90（B SkillMap）、#91（A 會員 UI）和 #92（Dashboard／XP mock data）已合併。[C 測驗 API PR #93](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/93) 仍 open，尚未合併；GitHub 目前顯示它不是 Draft，雖然 PR 文字寫著暫時以 Draft 提交。[B PR #84](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/84) 仍開啟；C 舊 PR #86 和 E 舊 PR #88 已關閉但未合併。

此 E PR #94 從目前 `main` 整合後，`/skillmap` 保留 `src/page/skill-map/SkillMapPage.jsx`；沒有把 C 的 `quizzes.js` 複製進 E app。C PR #93 的建立／讀題 routes、靜態教材 gate 及 C 專屬 helper 仍由 C PR 管理。E PR #94 提供 migration 010、`Idempotency-Key` CORS、題庫／可用性共用服務、完成／XP outbox services 和歷史 projection；接上 C route 前仍須做同 app、同測試 DB 的整合回歸。

本 PR 還包括：

- migrations 009–012：題目索引完整性、測驗歷史與冪等、admin owner/editor、密碼重設碼。
- `GET /api/skills/{skillId}/quiz-availability` 與 `GET /api/progress/history`。
- 首通 XP outbox enqueue、worker lease 欄位和 owner/editor 管理 API。
- OpenAPI／本機 API Explorer、開發模式 `/acceptance` 與唯讀 `/workbench`。
- A–D 獨立串接指南、安全審查、Schema／API 說明及流程 SVG 圖。
- 註冊成功即建立 session 並導向 onboarding；不要求先驗證 Email。密碼重設仍使用一次性六位數 Email code。

近期遠端進度影響整合順序：

- PR #92 的 XP 計算使用 mock data；它不是 D 的 DB worker／ledger 整合。Discord 訊息提到等待 C/E 後再做第二輪串接驗收。
- C PR #93 在其分支包含建立／讀題、冪等、快照和 CORS header；目前不含答案提交／結算 route，且尚未採用 E 的 migration 010。E 文件逐項指出 `Idempotency-Key`、取消後重試和 `skill_title_snapshot NOT NULL` 契約。
- 本機 shell 不能 fetch 遠端，但已用 GitHub Connector 核對 `main` 與 #93 的 head、diff、PR metadata；沒有因此改動隊友分支。

因此：

1. 從 GitHub `main` clone 的組員會拿到 PR #90–#92 的已合併內容，但不會拿到尚未合併的 E PR #94 或 C PR #93。
2. 一起驗收 E 服務前，請先確認所有人使用相同 PR #94 head SHA，並各自連自己的本機測試資料庫。C PR #93 與 E PR #94 的 routes、migration 和共用服務整合到同一測試分支後，才可做 C 的共用 app 驗收。
3. 團隊共五人（A–E），E 是 PR #94 作者；若要求三人 review，應由 A–D 中至少三位擔任 reviewer。PR #94 目前尚未指派 reviewer。

### 1.2 共同工作狀態表

下表把 GitHub issue／PR 狀態、已存在的本機服務和仍待模組串接的工作分開。**程式有服務或資料表，不等於模組端到端已驗收，也不代表 issue 已完成。**

| 模組 | GitHub 上可確認的狀態 | 本機後端可供整合的內容 | 仍需完成／驗收 |
| --- | --- | --- | --- |
| A | 登入／註冊畫面 PR #79 已合併；P2-A-01～06 仍開啟。個人資料 PR #81 已關閉但未合併。 | E 共用後端已採用「註冊後寄歡迎信、不寄驗證信」及「忘記密碼寄六位數碼」流程；忘記／重設頁已改用共用 API。 | A review 六位數碼欄位、錯誤提示和期限／嘗試次數等 E 安全實作值；完整會員前端與 onboarding 仍由 A 驗收。 |
| B | PR #84 仍開啟；PR #90 已合併 SkillMap page architecture。 | `GET /api/skills`、`GET /api/progress`、`GET /api/progress/history`、`GET /api/skills/{skillId}/quiz-availability`；另有獨立 B 串接指南。 | 提供正式 `skillId` 目錄、ready 條件並驗收畫面；availability GET 只供顯示，測驗 POST 必須重驗。 |
| C | C PR #93 提供建立／讀題 routes，仍未合併；PR #86 已關閉未合併。 | E 提供題庫／availability services、CORS、`recordSkillCompletion()`、首次 XP event enqueue、history API 和 migration 010；C-owned routes 尚未掛到 E app。 | 把 C route 對齊 E migration 和題庫 availability service；完成答案提交／結算，再做同一 app 與隔離 DB 的回歸。 |
| D | 儀表板切版 PR #39 已合併；P2-D-01～07 仍開啟。 | 本機 migration 有 `xp_outbox`、`xp_ledger` 及 lease 欄位；本機有首通 XP event enqueue 服務。 | 尚無 D 的 XP 消費 worker／發獎規則完整實作。D 需定義 claim、lease 確認／失敗、重試、入帳與等級規則，再和 C 做真實流程驗收。 |
| E | 管理後台 PR #40、題庫多選 PR #80 已合併；P2-E-01～07 仍開啟。 | Draft PR #94 包含 Express、PostgreSQL migrations、登入 session、owner/editor 管理、唯讀 `/demo`、安全 middleware、題庫與會員管理 API、共用回應格式、API Explorer、開發工作台和學習歷史橋接。 | 使用獨立測試 DB；完成 PostgreSQL major version 決策、正式 B 題庫資料及 A/B/C/D 真實串接驗收後，才更新 issue 完成狀態。安全部署與共用資料庫尚未在線上環境驗收。 |

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
  C[C 測驗建立／取題：PR #93 尚未合併] -. merge 後呼叫 .-> QB[題庫／可用性 backend services]
  C -. 作答／結算待實作 .-> Completion[recordSkillCompletion]
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
npm run admin:create -- your_name owner
```

1. `db:migrate` 依序套用未執行的 SQL migration。重跑時會略過已套用且 checksum 相同的檔案；不要修改已套用的 migration，schema 變更要新增下一個序號。
2. `db:seed` 載入本機展示分類、技能和示範題。示範題有 `is_demo=true`，不算正式題目覆蓋率；不要把展示資料當成正式課程內容。
3. `admin:create` 的 `your_name` 是本機最高管理者帳號；組員帳號另執行 `npm run admin:create -- <組員帳號> editor`。命令會要求輸入密碼，密碼不會顯示；需 12–72 字並同時包含英文字母和數字。正式服務的帳號建立需由可信任管理者使用 `DATABASE_MIGRATION_URL` 執行。

若指令回報資料庫連線錯誤，先確認 PostgreSQL 正在執行及本機 `backend/.env` 的主機、連接埠、資料庫名稱和帳密，再重跑 migration。**不要在共享／正式資料庫試跑 `db:seed`；正式管理員帳號只能由授權管理者依安全部署流程建立。**

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
| 會員登入前 | `POST /api/auth/register`、`POST /api/auth/login`、`POST /api/auth/forgot-password`、`POST /api/auth/reset-password/verify`、`POST /api/auth/reset-password` | 註冊後寄歡迎信；以六位數碼重設密碼。舊 `/verify-email` 只供仍有效的舊連結相容。 |
| 會員 session | `POST /api/auth/logout`、`POST /api/auth/change-password`、`GET /api/me`、`PATCH /api/me/profile`、`GET /api/progress`、本機版 `GET /api/progress/history` | 會員本人操作／查詢；以 session cookie 決定身份。 |
| 管理員登入前／session | `POST /api/admin/auth/login`、`GET /api/admin/me`、`POST /api/admin/auth/logout` | 獨立管理員登入狀態；管理員帳號由 `admin:create` 命令建立。 |
| 管理員 session | `/api/admin/questions`、`/api/admin/members` | 題庫 CRUD、搜尋與摘要；會員查詢、詳情、停權／恢復。需管理員 session。 |
| 會員 session | `GET /api/skills/{skillId}/quiz-availability`、`GET /api/progress/history`；C PR #93 提供 `POST /api/quizzes/attempts`、`GET /api/quizzes/attempts/:attemptId` | E branch 回可測驗狀態與已完成測驗歷史；C 的建立／讀題 route 尚未掛到 E app。答案提交與結算 routes 待 C 實作。 |

## 11. 組員依模組接線的步驟

### A：會員註冊、登入、個人資料

1. 用 `POST /api/auth/register` 建立自己的測試會員。只用自己可控制的測試 Email。
2. 註冊成功會立即建立可登入帳號並寄送歡迎信，不需要 Email 驗證步驟。開發環境沒有 SMTP 時，API 終端機會顯示歡迎信送出紀錄。
3. 瀏覽器登入後，session cookie 由伺服器設定；以 `GET /api/me` 讀取目前會員。
4. 以 `PATCH /api/me/profile` 儲存暱稱、頭像、學習路線或 onboarding 欄位。會員 ID 由 cookie 決定，不能在 request body 指定要改哪位會員。
5. 用 `POST /api/auth/logout` 登出，之後呼叫受保護的 `GET /api/me` 應回 `401`。
6. 忘記密碼：呼叫 `POST /api/auth/forgot-password`；本機無 SMTP 時在 API 終端機找六位數碼，再用相同 Email 和 code 呼叫 verify（可選）及 reset endpoint。驗證碼 10 分鐘有效、最多 5 次錯誤輸入、成功重設後撤銷所有會員 sessions。

### B：技能目錄、技能狀態和學習歷史

1. 在 client adapter 呼叫 `GET /api/skills`，讀取 `catalogVersion`、`categories` 和 `skills`。
2. 節點 key 一律採用正式 `skillId`，不要用 title、陣列位置或另造 `skillNodeId`。
3. 登入會員後呼叫 `GET /api/progress`。以相同的 `skillId` 比對 `completedSkillIds`，並依 B 的解鎖規則顯示節點狀態。
4. 若要顯示測驗活動，在本機最新版呼叫 `GET /api/progress/history?limit=20`。有 `nextCursor` 時用它取得下一頁；沒有記錄可能是 C 尚未寫入真實完成測驗。
5. 把資料載入、loading、空狀態、401/錯誤狀態都接到實際畫面，再以至少一筆登入會員的完成紀錄驗收。
6. 不要把 `catalogVersion` 當技能 ID；正式課程目錄、分類排序和節點座標仍要跟 B 對齊。

### C：測驗流程、答案判定與首次完成

E 分支提供共用歷史、題庫和可用性服務；C 的建立／讀題 routes 目前在 PR #93，尚未掛入這個共用 Express app。C 可在整合時於同一 app 註冊 route，並在後端匯入服務：

```js
import { listPublishedQuestionsForSkill } from '../services/question-bank.js';
import { recordSkillCompletion } from '../services/progress-service.js';
import { enqueueSkillFirstPassXpEvent } from '../services/xp-outbox.js';
```

串接時依序處理：

1. 測驗 routes 使用 `requireMember`；會員身份由 session cookie 決定，不接受 client 傳入 `userId`。
2. E 的 `GET /api/skills/{skillId}/quiz-availability` 與 `getQuizAvailability(database,{userId,skillId})` 驗證 active skill、會員先修條件和 C v1 題庫最低數；C 的 POST 建立 route 目前仍在 PR #93，合併前要在其 transaction 內重驗。C route 可由 `listPublishedQuestionsForSkill(database, skillId)` 取已發布、啟用、未軟刪除、非 demo 題。此 service 包含答案索引，**只供可信任的後端判分，絕不能把 `correctChoices` 回傳瀏覽器**。
3. 建立測驗會快照題目、選項、技能名稱和答案，採用 `Idempotency-Key`，資料表以 `(user_id, idempotency_key)` 保護建立重送。依目前 API 契約抽 5 題；新 attempt 會保留並標記同會員、同技能的舊進行中 attempt 為取消。每次新建立操作產生 UUID；逾時重試使用同一 key 和同一 `skillId`。詳見[操作說明](idempotency-key-guide.md)。
4. C PR #93 的 `GET /api/quizzes/attempts/:attemptId` 只允許同一會員讀取；合併驗收需確認即使 attempt 還在進行中，也不會回正解或解析欄位。
5. 待實作的答案 routes 應用登入 session 限定 attempt 所屬會員；結算時伺服器用快照答案重新判分，不相信前端分數。
6. 只有 `passed=true` 的完成 attempt 才可在同一 DB transaction 內呼叫 `recordSkillCompletion(database, { userId, skillId, attemptId })`。它會拒絕不屬於該會員／技能或未通過的 attempt；同技能重考不重複新增完成紀錄。
7. 讀取 `recordSkillCompletion()` 的回傳值；只有 `newlyCompleted === true` 時，才在同一 transaction 呼叫 `enqueueSkillFirstPassXpEvent(database, { userId, skillId, attemptId })`。回滾時 attempt 結果、完成狀態、revision 和 XP event 要一起回滾。
   ```js
   const completion = await recordSkillCompletion(client, { userId, skillId, attemptId });
   if (completion.newlyCompleted) {
     await enqueueSkillFirstPassXpEvent(client, { userId, skillId, attemptId });
   }
   ```
8. 用 `GET /api/progress` 和 `GET /api/progress/history?skillId=...` 驗證 B、D 所讀到的結果；歷史游標後續頁要沿用相同 `skillId`。確認連續重送不會重複建立測驗、計分、完成紀錄或 XP event。

建立或擴充 route 時，請在 `backend/src/app.js` 註冊共用 router；`backend/src/server.js` 只負責啟動既有 app，不要另建第二個 Express instance。

目前 C 前端可呼叫本分支已掛載的可用性與共用歷史端點；建立／取題需等 PR #93 合併／整合，答案提交與結算仍待完成。尚未接上的畫面需明確標示 mock 資料；不可將管理員題庫 API 當成會員測驗 API。

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
| 會員登入回 `INVALID_CREDENTIALS` | 確認帳號存在、未停權且密碼正確；新註冊不需要 Email 驗證步驟。 |
| progress API 回 401 | 先完成會員登入並保留該瀏覽器的 session cookie。 |
| `/api/progress/history` 為空 | C 還沒建立／結算真實測驗，或 DB 沒有已完成 attempt；demo seed 不會產生會員歷史。 |
| 題庫覆蓋率不是 ready | 檢查正式發布題數；demo、草稿、停用和軟刪除題不計入覆蓋率。 |
| `npm ci` 版本或 engine 錯誤 | 切換至 Node 24.x，刪除舊終端機並開新終端機後再安裝。 |
| 重設密碼頁面開錯 port | 將 `PUBLIC_APP_URL` 改成實際 Vite 網址，重啟 API 後重新申請驗證碼。 |

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
