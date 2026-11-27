# C 測驗 API 與共用後端整合紀錄

本文記錄本分支對 C [PR #86](https://github.com/Coding-Skill-Tree/Skill-Tree/pull/86) 的差異和整合選擇。PR #86 的原始分支未被直接 merge 或改寫；本分支把建立／取題功能依共用後端架構移植並調整，應由 C 再 review 一次。

## 差異與處理方式

| PR #86 原始實作 | 本分支處理 | 原因 |
| --- | --- | --- |
| `server.js` 自行建立 Express app 和註冊所有 routes。 | 在 `backend/src/routes/quizzes.js` 實作 router，從共用 `backend/src/app.js` 註冊；保留現有 `server.js` 啟動器。 | 一個 Express app 統一使用 request ID、CORS、origin 檢查、錯誤 envelope 和其他共用 routes。 |
| 建立 attempt 未寫 `skill_title_snapshot`。 | 同一 transaction 讀取 active skill title，寫入 `skill_title_snapshot`，空標題以 skill ID 作快照值。 | migration 010 將欄位設為 `NOT NULL`，也要維持舊測驗顯示名稱。 |
| 沒有 `Idempotency-Key` 和 fingerprint。 | 強制 UUID header，依正規化 `{ skillId }` JSON 的 UTF-8 bytes 產生 SHA-256；以會員和 key 唯一。相同請求回原 attempt，不同請求回 `409 IDEMPOTENCY_KEY_REUSED`。 | 網路逾時後重試不能意外新增第二筆測驗；與 migration 010 和 API 契約一致。 |
| 只接受單選、3 個選項，並將正確索引限制在 0–2。 | 使用現有正式題庫 service；支援 schema 中 2–10 個選項、單選／多選和索引快照。 | 題庫 migration 008 已支援多選與 2–10 個選項。 |
| 題庫數量少於 8 道時拒絕建立。 | 目前依 API 契約以 5 道正式可用題為最低值，建立 5 題 attempt。 | 契約和 `db:question-coverage` 使用 5；C PR #86 的 8 道可用題門檻尚未由 B/C/E 確認。若決定提高門檻，需同步改契約、route、Explorer 和測試。 |
| GET 在某題已作答時回 `correctChoices` 和解析，即使 attempt 還在 `in_progress`。 | learner response 僅讀 prompt、choices、answer mode、selected choices 和 answered time；永不從這支 query 讀正解或解析欄位。 | 防止會員在測驗尚未完成前取得答案。結果應由完成後的 result endpoint 提供。 |
| 建新測驗前刪除舊的進行中測驗。 | 保留舊 attempt；新建 attempt 不做破壞性刪除。 | 保留測驗歷史與原本 idempotency key 的重送結果。 |
| 使用硬編碼、唯一為 draft 的 `tutorials.js` 判定教材可否測驗。 | 移除該靜態 gate，改用共用 DB 的 active skill、先修條件和正式已發布題庫判定。 | 該檔不是共享課程目錄且目前資料為 draft，會讓其他技能永遠無法開始；日後若要檢查教材狀態，應由共用資料來源提供。 |

## 已接入的行為

- `POST /api/quizzes/attempts`：會員 session、active skill、先修條件、正式題庫篩選、五題不重複抽取、技能名稱 snapshot、migration 010 冪等鍵與單一 transaction。
- `GET /api/quizzes/attempts/:attemptId`：檢查 UUID 和會員所有權；同一會員可讀取題目快照；不存在或非本人資源一致回 404。
- JSON response 使用共用 `sendSuccess()`；驗證和衝突沿用 `validationError()`／`HttpError`；DB 使用既有 pool 和 repository service。
- API Explorer 可輸入 OpenAPI 定義的 request header，才能實際送出建立測驗要求的 `Idempotency-Key`。
- 前端 `src/services/quizzes.js` 提供安全 UUID 產生、建立和讀取 adapter；重試沿用同一 key。

## 待 C／團隊確認或完成

- 請 C review 本分支的資料形狀、先修行為和 5／8 題門檻差異；目前程式選用既有共用契約 5 題門檻，尚未把 C 的 8 題想法視為正式決策。
- 答案提交、完成結算、結果讀取和測驗歷史 HTTP routes 尚未實作。`recordSkillCompletion()` 和 XP event enqueue 仍需在後續 C completion transaction 中接入。
- 本分支測試新增了 C 建題／取題整合情境，但本機目前沒有 `TEST_DATABASE_URL`，尚未在隔離 PostgreSQL 上執行整合測試。純抽題與工作台安全邊界測試可獨立執行。
- 不因建立／讀取 API 已存在就關閉 C 或 E Issue，也不代表 B/C/D 畫面已端到端串接。
