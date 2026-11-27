# C 測驗 API 與 E 共用後端對齊

本文件依 2026-11-28 的遠端狀態整理。C 的 [PR #93](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/93) 仍未合併；E 分支不複製 C 的 `quizzes.js` router。C 的 router、抽題 helper 和靜態教材資料仍由 C 的 PR 維護。E 提供合併後所需的 migration、CORS header、題庫查詢／可用性服務、完成紀錄、XP Outbox 和學習歷史投影。

## PR #93 與 E 分支的界線

| 項目 | C PR #93 | E 提供／對齊結果 |
| --- | --- | --- |
| 開始測驗、隨機取五題、建立快照 | C-owned router；目前在 PR branch，尚未進入 E app | E migration 010 建立 `skill_title_snapshot NOT NULL`、Idempotency 欄位及唯一索引 |
| `Idempotency-Key` | C 驗 UUID、fingerprint、同會員鎖與重試 | E CORS allowlist 允許 `Idempotency-Key`；說明見[冪等鍵指南](idempotency-key-guide.md) |
| 題庫條件 | C 現在於 router 自行寫 SQL | E 提供 `listPublishedQuestionsForSkill()` 和 `getQuizAvailability()`，讓 C route 與技能畫面共用 eligibility 規則 |
| 教材 ready | C PR 使用 `tutorials.js` 的 `isTutorialReady()` | 共用 schema 目前沒有 lesson-ready 欄位；E 的可用性以 active skill、先修完成和符合規格的正式題庫數為準。若產品需要教材狀態，需先訂資料來源／欄位再整合 |
| 永久通過／XP | C 負責在完成測驗時呼叫 | E 提供 backend-only `recordSkillCompletion()`、`enqueueSkillFirstPassXpEvent()`；同一 transaction 使用同一 DB client |
| 學習歷史 | C 讀取完成測驗歷史 | E `GET /api/progress/history` 從 `user_learning_activity_history` 投影讀取 |
| 作答與結算 | #93 diff 沒有答案提交或結果 route | 尚未提供。這不會由 E 的建立／讀題依賴取代 |

## C × E 已確認的產品流程

以下是 [PR #88 的 C 模組逐項決議](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/88#issuecomment-7212566961)，新接線需保持一致；答案 API 的完整 request／response 欄位仍由 C 在實作時定義。

- MVP 目標為 5 個技能，每個技能至少 5 道合格正式題，每場隨機抽 5 題。五個正式 `skillId` 和教材 ready 的正式資料來源尚待確認。
- C v1 只抽三選一、固定 3 選項、1 個正解的題目。正式題庫覆蓋率按這些規則計算，demo 題不列入。
- 使用 `attemptId` + `ordinal`（1–5）定位作答快照。提交後答案鎖定；返回上一題只能檢視，不能重新作答，流程須按「下一題」前進。
- 每題提交後只回傳答對／答錯，不提供正解或解析；完成五題後才在結果頁顯示成績、通過狀態、正解與解析。
- 舊進行中 attempt 保留並標記 `cancelled`；不可續答、重新啟用或列入完成歷史。重送舊 key 仍回舊 attempt；另開一場必須用新 key。
- C 負責測驗資格、抽題、作答與判分；E 提供永久完成狀態、revision、XP Outbox 和共用歷史。已永久通過的技能是否仍可重考尚待 C 確認。
- 歷史沿用 `GET /api/progress/history`。C 第一頁取 10 筆，後續帶 `nextCursor`，並沿用相同的 `skillId` 篩選。

## 需要在合併前對齊的項目

1. **把靜態教材 gate 換成共用可用性判斷。** C PR 的 `tutorials.js` 目前只有一筆 `status: "draft"`，`isTutorialReady()` 只接受 `published`，因此該技能也會被擋在 `409 TUTORIAL_NOT_READY`；其他技能不存在於這張靜態表。C 可在建立 route 的 transaction 中呼叫 E 的 `getQuizAvailability(client, { userId, skillId })`，再以 `listPublishedQuestionsForSkill(client, skillId)` 取得 server-only 的正式題庫。若仍需要課程 ready gate，請先讓該欄位有正式 DB/API 來源。
2. **快照欄位相容。** migration 010 對舊資料以技能標題（空白時退回 `skill_id`）回填，之後設 `NOT NULL`；C 建立新 attempt 時需提供非空 `skill_title_snapshot`。C PR #93 已寫入此欄位。
3. **統一錯誤碼與取消重試。** C PR 實際回 `409 IDEMPOTENCY_KEY_CONFLICT`（同 key 不同本文）。相同 key 的 attempt 若後來已取消，重送會回原 attempt（`200`，`status: "cancelled"`），不建立新 attempt；讀取已取消 attempt 回 `404 ATTEMPT_NOT_FOUND`。新一場需新 key。C PR #93 目前取消同一會員、同一技能的舊進行中 attempt；共用 app 整合測試需確認這個範圍。
4. **維持答案隔離與鎖定。** C router 的讀題 response 不應包含正解或解析；已作答題目只可回傳所選答案及答對／答錯，不可改寫答案。完整正解與解析只在五題結算後提供。正解只保留於 DB snapshot 及可信任 server code。PR #93 尚未包含 answer submit/result route，前端不可把它們視為已可呼叫。
5. **接上共同 Express。** E 的 `backend/src/app.js` 不註冊 C router，直到 C PR 合併或另行取得整合版 router；CORS、body parser、request ID、標準錯誤和 E migration 都需在同一 app／測試 DB 驗證。

## E 提供的可用性 API

`GET /api/skills/{skillId}/quiz-availability` 需會員 session，只回可否開始、原因、缺少的先修技能 ID、符合 C v1 規格的可用題數和最低需求數。它不會回傳題目或答案。這個 GET 方便 B 的技能地圖顯示「可開始／被先修鎖定／正式題數不足」；開始測驗的 POST 仍必須在自己的 transaction 內重驗，不能信任前端先前取得的 GET 結果。

Eligibility 條件為：技能與分類啟用；先修技能已由目前會員完成；題目為已啟用、已發布、未刪除、非 demo、單選、三個選項、一個合法正解，且題幹／選項／解析完整；至少五題才可開始。此服務不推斷教材已完成或已發布，因為目前共用 schema 沒有這項狀態。

管理員題庫 API 可回正解，但只接受管理員 session。`listPublishedQuestionsForSkill()` 是 backend-only service，回傳正解給可信任的 C route 判分，不是瀏覽器 API。

## 完成測驗與歷史

C 的答案與結算流程完成後，應在同一 transaction 鎖定 attempt、驗證 owner／ordinal、從 DB 快照判分、只結算一次；若首次通過，再呼叫 `recordSkillCompletion(client, { userId, skillId, attemptId })` 與 `enqueueSkillFirstPassXpEvent(client, { userId, skillId, attemptId })`。`userId` 必須來自 `request.member.id`，不得來自 request body。

完成後，歷史由 `GET /api/progress/history?skillId=<skillId>&limit=10` 取得。它只列已完成測驗，不包括 cancelled 或 in-progress attempt，也不新增第二份 C 專用歷史資料表。

## 驗收狀態

- C PR #93 描述其獨立 PostgreSQL 環境通過 97 項回歸測試；那不是 E 最新 main 分支的 live 整合結果。
- E branch 的整合驗收需在隔離 `TEST_DATABASE_URL` 上套用完整 migrations，並以同一 `app.js` 驗證 C route、CORS 預檢、冪等競態、題目 snapshot、會員隔離、完成進度、history 與 XP outbox。
- 沒有安全的 TEST_DATABASE_URL 時，不可用正式或私人資料庫代替，也不應宣稱 live DB 驗收已通過。
