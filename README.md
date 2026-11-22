# Skill Tree

Skill Tree 是遊戲化的前端工程學習工作區。前端以 React、JavaScript、Vite 開發；共用視覺 tokens 放在 `src/style/variables.css`。主線學習儀表板位於 `/`，E 管理後台位於 `/admin`。

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

## E 管理後台

- E01 顯示資料庫中的題目總數、已發布／草稿數、分類分布和最近新增題目。
- E02 題庫列表支援伺服器端搜尋、分類／狀態篩選、分頁和軟刪除。
- E03 新增／編輯表單會載入資料庫中的技能節點並儲存題目、三個選項、正確答案、解析、難度與狀態。
- E04 題目詳情由資料庫載入，顯示技能分類、正解、解析及建立／更新時間。
- 管理畫面使用獨立管理員 session；未登入時需先登入，資料庫與 API 尚未啟動時會顯示連線提示。
- 深色表面、青檸綠主色、共用 tokens、1440px 內容寬度與 1279／940／639px 版面斷點延續目前主線 dashboard。後台操作按鈕維持至少 44px 觸控高度。

## API 與資料庫

- `GET /api/health`：API 與資料庫連線狀態。
- `/api/auth/*`、`GET /api/me`：會員註冊、Email 驗證、登入、登出與會員狀態。
- `/api/admin/auth/login`、`GET /api/admin/me`、`POST /api/admin/auth/logout`：獨立管理員 session。
- `/api/admin/questions`：管理員題庫查詢、新增、編輯、軟刪除、分類／技能選項與總覽摘要。
- `/api/admin/members`、`/api/admin/members/:id`：A09 會員搜尋與分頁、A10 會員詳情；詳情提供角色、Google 綁定、XP、等級、學習進度及停權／恢復操作。
- `GET /api/progress`：登入會員讀取 `catalogVersion`、`revision`、`completedSkillIds`。

成功回應使用 `{ "success": true, "data": ... }`，錯誤使用 `{ "success": false, "error": { "code", "message", "requestId", "details" } }`。BIGINT ID 以字串傳送，時間使用 UTC ISO 8601。管理員會員 API 對齊 A 組第一階段假 API 欄位；角色和等級存於會員資料，等級公式仍待小組確認；Google 綁定資料由 `member_auth_identities` 保存，但 OAuth 串接尚未實作。XP 與分類進度分別讀取帳本和完成紀錄。前端共用 API client 在 `src/services/api.js`；管理員登入和題庫 adapter 分別在 `src/services/adminAuth.js`、`src/services/adminQuestions.js`。

題目使用技能節點 ID 關聯分類，選項固定三個，`correctChoice` 是從 0 開始的索引。資料庫進度表使用 `user_skill_completions`，migration 006 將舊 scaffold 表名 `completed_skills` 遷移至 Issue #1 討論的共用名稱；migration 007 增加會員角色、等級與 Google 綁定資料。等級計算規則和 Google OAuth 流程仍待小組確認，既有 migration 保持不變。

C 負責測驗 UI、測驗開始／作答／評分／歷史 API；本次沒有新增這些測驗端點。進度 API 是 E 提供的共用讀取介面。尚未接入正式部署環境、正式 SMTP 或 production 資料庫，請以各組員完成本機 migrations 與 API health 檢查作為環境驗收依據。
