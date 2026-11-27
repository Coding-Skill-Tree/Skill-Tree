# C｜測驗 API、冪等、永久通過與歷史

這份指南區分 C 目前自己的 PR 與 E 已準備的共用依賴。**C 的 PR #93 尚未合併到 E app；答案提交與結算也還沒有 API。**請在同一個 E integration branch 上確認 migration 後再做 live DB 驗收。

## C 的 PR #93 已提供什麼

PR #93 提供 `POST /api/quizzes/attempts` 建立測驗，以及 `GET /api/quizzes/attempts/:attemptId` 取得本人題目快照。建立時需要 UUID `Idempotency-Key`，依 C v1 篩選正式題庫並抽五題，寫入技能標題和題目快照；同會員、同技能的舊進行中測驗會標成 `cancelled`。目前 router 還在 C 的 PR branch，E 的 `backend/src/app.js` 尚未掛載它。

| 情境 | C PR #93 現行結果 |
| --- | --- |
| 首次建立 | `201`；回 attempt 摘要 |
| 同會員、相同 key、相同本文重送 | `200`；回原 attempt。若該 attempt 已取消，回應的 `status` 仍為 `cancelled`，不會重開或另建 |
| 相同 key、不同本文 | `409 IDEMPOTENCY_KEY_CONFLICT` |
| 同一會員並行相同 key | 會員 row lock 序列化，應只新增一個 attempt |
| 讀取已取消 attempt | `404 ATTEMPT_NOT_FOUND` |
| 讀取不存在或非本人 attempt | `404 ATTEMPT_NOT_FOUND` |

完整重試規則見[Idempotency-Key 使用說明](../idempotency-key-guide.md)。

## E 提供的共用依賴

- **Migration 010**：將舊 attempt 的 `skill_title_snapshot` 回填後設成 `NOT NULL`；新增 `idempotency_key`、32-byte SHA-256 fingerprint、會員/key 唯一索引及已完成學習歷史 view。
- **CORS**：允許 `Idempotency-Key` request header。
- **`listPublishedQuestionsForSkill(database, skillId)`**：backend-only 題庫來源，排除停用、草稿、軟刪除和 demo 題；回傳正解欄位只供可信任的 server route 判分。
- **`getQuizAvailability(database, { userId, skillId })`**：回傳 active skill、會員先修狀態及 C v1 符合題數，不回題目內容或正解。B 可用 `GET /api/skills/{skillId}/quiz-availability` 顯示可開始狀態；C 的 POST 仍需於 transaction 內重驗。
- **`recordSkillCompletion(database, { userId, skillId, attemptId })`**：必須在已通過 attempt 結算的同一 transaction 使用；首次通過才新增永久完成紀錄及增加 progress revision。
- **`enqueueSkillFirstPassXpEvent(database, { userId, skillId, attemptId })`**：首次通過時寫入 outbox，最終 XP 金額由 D 規則決定。
- **`GET /api/progress/history`**：查詢已完成測驗的共用歷史 projection，不重複建立 C 專用 history。

`database` 參數應傳同一個 PostgreSQL transaction client。會員身份只能取自已驗證的 `request.member.id`，不要讀取瀏覽器提供的 `userId`。

## PR #93 合併前要一起對齊

1. 把 `tutorials.js` 的靜態 `isTutorialReady()` gate 換成可共用資料來源。該檔目前只有一筆 `draft` 範例；它會使該技能也回 `TUTORIAL_NOT_READY`，其他技能因不存在而一樣不能開始。共用 DB 目前沒有教材 ready 欄位，E availability service 不假裝知道教材狀態；若產品確實需要此 gate，請先確立其 schema/API owner。
2. 讓 C route 使用 E 的題庫和 availability service，避免兩邊各維護一份啟用／發布／刪除／題型篩選 SQL。若仍在 route 中查資料，請至少確保其條件與服務完全一致。
3. 維持 `skill_title_snapshot` 非空。migration 010 對舊列以技能名稱回填，沒有有效名稱時使用 `skill_id`；新的 attempt 應採相同 fallback，避免被非空限制擋下。
4. 在同一 Express app 裝入 C router 後，補做 live PostgreSQL 回歸：migration 套用、Idempotency-Key CORS、同 key 併發、不同會員隔離、取消後重送、快照和 transaction rollback。

## 還未提供的 C endpoints

下列項目是 C 測驗作答與結算範圍，E 的建立／讀題支援不代表它們已完成：

- `POST /api/quizzes/attempts/:attemptId/answers`：驗證 owner、ordinal、單選索引和尚未作答狀態；由伺服器使用 snapshot 判分；已提交答案不可被改寫。
- 結果讀取 endpoint：測驗完成後才回總分、pass/fail、每題正解和解析。作答階段不要洩漏答案索引或解析。
- 最後一題結算和永久完成／XP enqueue 要在單一 transaction 原子完成，避免重送重複產生完成、revision 或 XP 事件。

實際 request/response、狀態和錯誤碼需由 C 確認後補入 OpenAPI。E 只提供 backend-only service；不要讓瀏覽器直接寫完成紀錄、XP 或 `userId`。

## 題庫驗證方式

`npm run db:question-coverage` 會輸出一般已發布題數，以及符合 C v1 單選、三選項、一個正解、完整解析規則的題數。C 的五個 MVP `skillId` 清單仍需內容 owner 確認；目前開發 seed 是 demo 題，不會算作正式題庫。
