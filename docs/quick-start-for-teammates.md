# 組員快速開始指南

這份指南帶你在自己的電腦啟動 Skill Tree。每位組員使用自己的 PostgreSQL 和登入資料；照著做不會連到其他人的電腦。

## 你需要的工具

- Node.js 24 和 npm
- PostgreSQL 17，或 Docker Desktop
- Git 和專案原始碼

先在終端機確認版本：

```bash
node --version
npm --version
psql --version
```

Node 應顯示 `v24.x`。資料庫連接方式和 Docker 範例請看[後端與資料庫上手指南](backend-onboarding.md)。

## 第一步：安裝專案套件

開啟專案根目錄的終端機。根目錄應有 `package.json`。

```bash
npm ci
npm --prefix backend ci
```

前端和後端各有一份相依套件清單，所以兩個指令都要執行。

## 第二步：建立自己的開發資料庫

建立本機 PostgreSQL 資料庫後，複製範例設定：

```bash
cp backend/.env.example backend/.env
```

打開 `backend/.env`，只填入你自己電腦的 `DATABASE_URL`。不要把 `.env` 貼進 GitHub，也不要把資料庫密碼打在共用終端機或截圖裡。其他必要設定、SMTP 選項和 URL encoding 說明在[後端與資料庫上手指南](backend-onboarding.md)。

在專案根目錄套用 schema、載入展示資料：

```bash
npm run db:migrate
npm run db:seed
```

`db:seed` 只用於自己的開發資料庫。展示題不算正式題庫內容。

## 第三步：啟動前端和 API

開兩個終端機，都保持在專案根目錄。

終端機 A：

```bash
npm run dev:api
```

終端機 B：

```bash
npm run dev
```

Vite 會把瀏覽器的 `/api` 請求轉給本機 Express API。打開 Vite 終端機顯示的網址，通常是 `http://localhost:5173`。

## 第四步：看見服務怎麼運作

1. 開啟 `http://localhost:5173/workbench`，先確認 API 和 PostgreSQL 顯示已連線。點流程卡片可以跳到對應程式碼。
2. 在工作台點「互動式 API 文件」，或直接開啟 `http://localhost:5173/api/docs`。登入後可在同一瀏覽器使用會員／管理員 session。
3. 開啟 `http://localhost:5173/acceptance`，逐項檢查本機 API、狀態碼和回應格式。
4. 若 health 顯示未連線，先看 API 終端機，再確認 PostgreSQL 正在執行及 `DATABASE_URL` 指向正確資料庫。

`/workbench` 只讀取 health、OpenAPI、migration 名稱和固定白名單程式碼。`/api/docs` 會真的送出你選的請求；新增、編輯、刪除題目和會員狀態操作會改變本機資料。

## 前端送出測驗建立請求的例子

前端共用 API adapter 在 `src/services/quizzes.js`。呼叫前先建立一個 UUID；遇到逾時時用原本的 key 重試。開始另一筆測驗時才產生新的 key。

```js
import { createQuizIdempotencyKey, startQuizAttempt } from "./services/quizzes.js";

const key = createQuizIdempotencyKey();
const attempt = await startQuizAttempt("html-basics", key);
```

C 的 `POST /api/quizzes/attempts` 與 `GET /api/quizzes/attempts/:attemptId` 目前在 PR #93，尚未掛到 E 共用 app；切換到 E branch 直接呼叫會得到 404。E 已提供會員限定的 `GET /api/skills/{skillId}/quiz-availability`、題庫共用 service 和完成後的 `GET /api/progress/history?skillId=...`。答案提交與結算 routes 尚待 C 完成，因此目前還不能用共用 app 完成整場測驗。建立測驗要帶 `Idempotency-Key`；網路結果不確定時，沿用相同 key 和 `skillId` 重試，參考[操作說明](idempotency-key-guide.md)。管理員題庫 API 會回傳正解，不要拿它當會員作答 API。

## 開始前端 API 測試

自動化 API 測試會套用 migration 並建立／清理測試資料。**先建立獨立測試資料庫**，資料庫名稱須含有 `test`，並將 `TEST_DATABASE_URL` 指向它；不能和 `DATABASE_URL` 指向同一個資料庫。

```bash
TEST_DATABASE_URL='postgresql://使用者:密碼@127.0.0.1:5432/skill_tree_test' npm run test:api
```

若不確定資料庫是否安全，先不要執行；查閱[後端與資料庫上手指南](backend-onboarding.md)的測試資料庫章節。測試不會使用 production DB，也不會自動 drop 整個資料庫。

## 遇到問題時

| 看到的訊息 | 先檢查 |
| --- | --- |
| `DATABASE_UNAVAILABLE` | PostgreSQL 是否已啟動、資料庫是否建立、`DATABASE_URL` 的 host／port／帳密是否正確，再執行 `npm run db:migrate`。 |
| `ORIGIN_NOT_ALLOWED` | 瀏覽器是不是用 Vite 的網址；`APP_ORIGINS` 是否包含實際網址。修改後需重啟 API。 |
| `UNAUTHENTICATED` | 先在同一個瀏覽器登入會員；cookie 由 API 自動設定，不要手動貼 cookie。 |
| 套件找不到 | 根目錄和 `backend` 都需要 `npm ci`。 |
| migration 失敗 | 不要修改已套用 migration；把錯誤和 migration 檔名交給後端負責人檢查。 |

## 文件怎麼選

- 第一次啟動：本文件 → [後端與資料庫上手指南](backend-onboarding.md)
- 實作前後端 API：先查 [API 契約](api-contract.md)，再看 [工作台導覽](developer-workbench.md)
- 查資料表：看[資料庫 Schema 概覽](database-schema.md)
- 團隊串接與 issue 狀態：看[團隊後端整合手冊](team-backend-integration-guide.md)
- 寫或審題庫內容：看[題庫規劃指南](question-bank-plan.md)
