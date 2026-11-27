# Skill Tree

Skill Tree 是遊戲化的前端工程學習工作區。前端以 React、JavaScript、Vite 開發；共用視覺 tokens 放在 `src/style/variables.css`。主線學習儀表板位於 `/`，E 管理後台位於 `/admin`。

## Commit 訊息格式

提交訊息統一使用「英文類型: 繁體中文摘要」，例如 `feat: 新增會員管理頁面`、`fix: 修正多選題答案判定錯誤`。英文類型採 Conventional Commits 慣例；本機提交範本位於 `.gitmessage`。

## 本機啟動

需要 Node.js 24 和 PostgreSQL（共用 PostgreSQL major version 仍待團隊確認；目前開發基線以 PostgreSQL 17 為準）。前端與後端各有自己的 package lock，請分別安裝依賴。

1. 在專案根目錄安裝前端依賴：

   ```bash
   npm ci
   ```

2. 複製 `backend/.env.example` 為 `backend/.env`，填入本機 `DATABASE_URL`。不要提交 `.env` 或資料庫密碼。
3. 在 `backend` 目錄安裝後端依賴、套用資料庫 migrations 並載入開發資料：

   ```bash
   cd backend
   npm ci
   npm run db:migrate
   npm run db:seed
   ```

   `db:seed` 只供本機開發資料庫使用；production 環境會拒絕執行。
4. 建立本機管理員帳號：

   ```bash
   npm run admin:create -- <帳號>
   ```

   命令列會要求輸入密碼，不要將密碼寫進指令或提交至 Git。
5. 開兩個終端機：在專案根目錄執行 `npm run dev`，另一個執行 `npm run dev:api`。

Vite 將 `/api` 代理至 `http://127.0.0.1:3000`。前端和後端需同時執行；根目錄 `npm ci` 只安裝前端套件。

新組員的逐步資料庫設定、API 測試和模組整合流程請看[後端與資料庫上手指南](docs/backend-onboarding.md)。

GitHub 進度、本機未推送版本狀態，以及 A–E 組員的串接和驗收步驟請看[團隊後端整合與驗收手冊](docs/team-backend-integration-guide.md)。

本機開發時可由導覽列開啟「驗收實驗室」，或直接前往 `/acceptance`。頁面逐步呼叫本機 API，顯示 HTTP 狀態、回應格式及驗收結果；資料庫整合測試紀錄和 B/C/D 尚待接入的項目也會分開標示。此頁只在 Vite 開發模式提供，不會打包進 production。完整後端測試請使用獨立 `TEST_DATABASE_URL` 後執行 `npm run test:api`。

A–E 共用的正式路由、欄位名稱、回應格式、認證方式及資料責任請看[API 契約 v1](docs/api-contract.md)。各模組實作 API 前先依這份契約對齊。

本機互動式 API 文件與測試工作台：先啟動前端及 API，再開啟 [`/api/docs`](http://localhost:5173/api/docs)；OpenAPI JSON 位於 [`/api/openapi.json`](http://localhost:5173/api/openapi.json)。登入後可在同一瀏覽器測試會員／管理員 session API。操作前請確認連到本機開發資料庫；寫入題目或停權會員會修改資料。

共用資料表、關聯、索引、migration 清單和資料責任請看[PostgreSQL Schema 概覽](docs/database-schema.md)。

## E 管理後台

- E01 顯示資料庫中的題目總數、已發布／草稿數、分類分布和最近新增題目。
- E02 題庫列表支援伺服器端搜尋、分類／狀態篩選、分頁和軟刪除。
- E03 新增／編輯表單會載入資料庫中的技能節點並儲存題目、2 到 10 個選項、每個選項的解析、單選／多選答案、整題解析、難度與狀態。
- E04 題目詳情由資料庫載入，顯示作答方式、所有正解、每個選項的解析、整題解析及建立／更新時間。
- A09／A10 會員管理已接入共用後台，可搜尋會員、查看會員／學習資料並停權或恢復帳號。
- 管理畫面使用獨立管理員 session；未登入時需先登入，資料庫與 API 尚未啟動時會顯示連線提示。
- 深色表面、青檸綠主色、共用 tokens、1440px 內容寬度與 1279／940／639px 版面斷點延續目前主線 dashboard。後台操作按鈕維持至少 44px 觸控高度。

## API 與資料庫

- `GET /api/health`：API 與資料庫連線狀態。
- `/api/auth/*`、`GET /api/me`：會員註冊、Email 驗證、登入、登出與會員狀態。
- `POST /api/auth/reset-password/verify`、`POST /api/auth/reset-password`：非消耗式重設連結檢查與一次性密碼重設。
- `PATCH /api/me/profile`：會員更新自己的暱稱、角色圖片並完成 onboarding；會員身份由 `sid` session 決定。
- `/api/admin/auth/login`、`GET /api/admin/me`、`POST /api/admin/auth/logout`：獨立管理員 session。
- `/api/admin/questions`：管理員題庫查詢、新增、編輯、軟刪除、分類／技能選項與總覽摘要。
- `/api/admin/members`、`/api/admin/members/:id`：A09 會員搜尋與分頁、A10 會員詳情；詳情提供角色、Google 綁定、XP、等級、學習進度及停權／恢復操作。
- `GET /api/skills`：公開唯讀技能目錄，提供分類、技能節點、學習項目、位置、先修關係與 `catalogVersion`。
- `GET /api/progress`：登入會員讀取 `catalogVersion`、`revision`、`completedSkillIds`。C 後端在 transaction 中呼叫 E 的 completion service 寫入通過的技能；沒有瀏覽器可傳入 `userId` 的通用寫入端點。

成功回應使用 `{ "success": true, "data": ... }`，錯誤使用 `{ "success": false, "error": { "code", "message", "requestId", "fields?" } }`。BIGINT ID 以字串傳送，時間使用 UTC ISO 8601。管理員會員 API 對齊 A 組第一階段假 API 欄位；角色和等級存於會員資料，等級公式仍待小組確認；Google 綁定資料由 `member_auth_identities` 保存，但 OAuth 串接尚未實作。XP 與分類進度分別讀取帳本和完成紀錄。前端共用 API client 在 `src/services/api.js`；管理員登入和題庫 adapter 分別在 `src/services/adminAuth.js`、`src/services/adminQuestions.js`。

### 共用回應與錯誤格式（E-06）

- 成功：`{ "success": true, "data": { ... } }`；建立資源回傳 HTTP 201，查詢／更新回傳 HTTP 200。登出和軟刪除等無內容操作回傳 HTTP 204，不帶 JSON body。
- 錯誤：`{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "表單內容有誤", "requestId": "...", "fields": { ... } } }`。`fields` 只在欄位驗證錯誤時出現。
- 使用 HTTP 400 表示請求或欄位格式錯誤、401 表示未登入、403 表示權限不足、404 表示資源不存在、409 表示資料衝突；資料庫暫時無法使用時回傳 503。
- API client 應先檢查 `success`，再讀取 `data`；錯誤時使用 `error.code`、`error.message` 和可選的 `error.fields` 顯示對應訊息。

### 題庫資料契約（E-05）

題目使用技能節點 ID 關聯分類。`choices` 是 2 到 10 個字串；`choiceExplanations` 依相同索引保存每個選項的解析；`answerMode` 為 `single` 或 `multiple`；`correctChoices` 是從 0 起算且不重複的正確選項索引陣列。單選題需一個索引，多選題至少需兩個。`explanation` 保留作為整題補充解析。舊的 `correctChoice` 僅供單選相容，使用多選的模組應讀取 `correctChoices`。

技能目錄的 `GET /api/skills` 回傳 `{ catalogVersion, categories, skills }`。每個技能使用 `skillId` 作為正式識別欄位，並提供 `categoryId`、`learningItems`、`position: { x, y }`、`sortOrder` 和 `prerequisiteSkillIds`。`GET /api/progress` 的完成清單也使用相同的 `skillId` 值；未登入的模組可讀目錄，會員進度需登入。

新增題目請傳送以下格式：

```json
{
  "skillId": "html-basics",
  "prompt": "哪些元素可用來建立表單控制項？",
  "answerMode": "multiple",
  "choices": ["input", "label", "main", "button"],
  "choiceExplanations": [
    "正確；input 可建立多種表單欄位。",
    "正確；label 可標示並關聯表單控制項。",
    "main 用來標示頁面主要內容，不是表單控制項。",
    "正確；button 可執行表單相關動作。"
  ],
  "correctChoices": [0, 1, 3],
  "explanation": "表單由控制項、標籤和操作按鈕組成。",
  "difficulty": "beginner",
  "status": "draft"
}
```

管理員題目詳情 API 回傳 `answerMode`、`choices`、`choiceExplanations`、`correctChoices` 和整題 `explanation`。資料庫 migration 008 將這些欄位加到題目與作答快照；快照另保存 `selectedChoices`，讓 C 能保存多選答案。C 負責測驗介面、答案判定、計分方式及結果呈現；E 提供題目資料、持久化欄位與 API 契約。多選題目前不定義部分給分。

資料庫進度表使用 `user_skill_completions`，migration 006 將舊 scaffold 表名 `completed_skills` 遷移至共用名稱；migration 007 增加會員角色、等級與 Google 綁定資料。等級計算規則和 Google OAuth 流程仍待小組確認，既有 migration 保持不變。

C 在共用 Express 中負責測驗開始／作答／評分／歷史 routes，並呼叫僅供 backend 使用的 E 題庫 repository；不得把管理員題庫 API 或正解欄位提供給瀏覽器。每個 active skill 至少需 5 道正式已發布題目；`npm run db:question-coverage` 可檢查題數，展示 seed 不算正式題目。

後端整合測試使用獨立 PostgreSQL test database，設定 `TEST_DATABASE_URL` 後執行 `npm run test:api`。runner 只接受名稱包含 `test` 的資料庫，會拒絕與 `DATABASE_URL` 指到相同資料庫，並且不會 drop 資料庫。正式部署、production SMTP 和共用資料庫仍需由團隊另外驗收。
