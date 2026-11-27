# PostgreSQL Schema 概覽

這份文件說明目前共用資料表、核心欄位、關聯和資料責任，方便 A–D 在實作前確認邊界。實際 Schema 以 `backend/migrations/*.sql` 為準；本文件不是可執行的 migration，也不取代模組負責人的業務規則確認。

## 基線與 migration

- 本機開發基線：PostgreSQL 17；團隊共用環境的 major version 尚待確認。
- migration 依檔名前綴順序套用。已套用的 migration 不可修改；Schema 變更必須新增下一個未使用序號。
- runner 使用 PostgreSQL advisory lock、SHA-256 checksum 和每個 migration 的 transaction。
- `npm run db:migrate` 可安全重跑；checksum 不一致時停止，不略過或覆寫已套用的 migration。

| Migration | 建立或變更的資料領域 |
| --- | --- |
| `001_identity_and_sessions.sql` | 會員、會員檔案、會員 session、Email token、管理員、管理員 session、稽核紀錄 |
| `002_learning_and_progress.sql` | 技能目錄、先修關係、題庫、測驗與快照、技能完成、XP outbox／ledger、進度 revision |
| `003_auth_limits.sql` | 會員／管理員登入與密碼重設節流 |
| `004_learning_integrity.sql` | 測驗題數與結果一致性、完成紀錄必須連到同會員／技能的測驗 |
| `005_question_admin_fields.sql` | 題目難度、草稿／發布狀態、軟刪除 |
| `006_user_skill_completions.sql` | 完成技能表正式名稱 |
| `007_member_admin_contract.sql` | 會員角色、等級及 Google identity 關聯 |
| `008_question_multiple_choice.sql` | 多選答案、選項解析與測驗快照欄位 |
| `009_question_answer_index_integrity.sql` | 舊完成資料 revision 回填、JSONB 答案索引值域／唯一性 constraints 和正式題庫查詢索引 |
| `010_learning_history_and_idempotency.sql` | 測驗建立冪等鍵、技能名稱快照、學習歷史唯讀 view、XP Outbox worker lease |
| `011_admin_roles.sql` | 管理員 `owner`／`editor` 角色及唯一啟用最高管理者限制 |
| `012_email_reset_codes.sql` | 密碼重設碼失敗次數欄位，限制單一驗證碼最多 5 次錯誤輸入 |

## 資料表與關聯

| 資料表 | 核心內容 | 關聯與責任 |
| --- | --- | --- |
| `users` | Email、密碼雜湊、驗證及停權時間 | A 管理帳號生命週期；E 管理身份 Schema |
| `member_profiles` | 暱稱、頭像、學習路線、onboarding、角色及等級 | 一位 user 對一筆 profile；會員只能由 `sid` 對應的 user 更新 |
| `member_sessions` | session token 雜湊、會員及到期時間 | token 只保存雜湊；停權或登出撤銷 session |
| `email_tokens` | 舊 Email 驗證／密碼重設碼用途、HMAC 雜湊、到期、失敗次數與使用時間 | 不保存原始驗證碼；重設碼 10 分鐘有效、一次性使用，錯誤 5 次後失效 |
| `member_auth_identities` | Google provider subject 與會員關聯 | OAuth 流程尚未實作；此表只記錄已確認的 identity link |
| `admin_accounts`, `admin_sessions` | 獨立後台帳號與 session | `owner` 為唯一最高管理者；`editor` 為組員角色；管理員身份不與會員 session 混用 |
| `admin_audit_log` | 管理員動作、目標及 metadata | 會員停權／恢復及題目維護操作留存稽核紀錄 |
| `auth_rate_limits` | scope、雜湊 subject、失敗數、冷卻與寄送節流 | 不以 Email 明文作 rate-limit key |
| `skill_categories` | 技能分類名稱、排序、啟用狀態 | B 確認正式分類及排序 |
| `skills` | `skillId`、分類、學習內容、座標、catalog version、排序、啟用狀態 | B 提供正式目錄；E 維護儲存與讀取契約 |
| `skill_prerequisites` | 技能節點間先修關係 | 複合主鍵避免同一關係重複；B 負責畫面解鎖判斷 |
| `questions` | 題目、技能、選項、答案索引、解析、難度、發布／刪除狀態 | E 管理題庫資料；C 確認取題及作答快照格式 |
| `quiz_attempts` | attempt ID、會員、`skill_id`、技能名稱快照、目錄版本、狀態、答對數／總題數、通過狀態、開始／完成時間、建立冪等 key 與 request fingerprint | C 負責開始、抽題、判分與測驗歷史；正式技能識別欄位為 API 的 `skillId` |
| `quiz_attempt_questions` | 題目及作答時內容快照、正解和會員選取 | 不受後續編輯題目影響；答案資料只能在可信任 backend 使用 |
| `user_skill_completions` | 會員首次通過某技能的 attempt 與完成時間 | 永久通過／進度摘要；唯一鍵 `(user_id, skill_id)` 保證同技能只完成一次 |
| `user_progress_revisions` | 每位會員的進度版本 | 首次新增完成紀錄時加一；重複提交不增加 |
| `user_learning_activity_history` | 由已完成測驗投影出的唯讀學習歷史 | View，不複製測驗資料；D 的歷史 API 依 session 會員讀取 |
| `xp_outbox` | 首次通過事件、來源 key、狀態、重試與 worker lease | C 在首次完成交易中產生事件；D 定義獎勵並消費事件 |
| `xp_ledger` | 已發放 XP 的不可重複帳本 | event ID 唯一；D 擁有遊戲化規則，E 提供持久化 |
| `schema_migrations` | migration 檔名、checksum、套用時間 | migration runner 管理，不由應用程式直接寫入 |

## 核心欄位字典

| Table／欄位 | 型別 | 規則 |
| --- | --- | --- |
| `quiz_attempts.id` | UUID | attempt ID，建立後不變 |
| `quiz_attempts.user_id` | BIGINT FK → `users.id` | 會員本人；只能從 session 填入 |
| `quiz_attempts.skill_id` | VARCHAR(80) FK → `skills.id` | API 的 `skillId`；使用 B catalog 原值，不因顯示名稱變更而改 ID |
| `quiz_attempts.skill_title_snapshot` | VARCHAR(120) | 建立 attempt 時複製技能名稱，供歷史顯示 |
| `quiz_attempts.catalog_version` | INTEGER | 建立測驗時使用的目錄版本 |
| `quiz_attempts.status` | VARCHAR(20) | 僅 `in_progress`、`completed`、`cancelled` |
| `quiz_attempts.total_questions` | SMALLINT | 固定 5；DB constraint 已限制 |
| `quiz_attempts.correct_count`, `passed` | SMALLINT, BOOLEAN | 未結算為 NULL；completed 必須同時有結果 |
| `quiz_attempts.started_at`, `completed_at` | TIMESTAMPTZ | UTC 時間；完成時間只在結算時寫入 |
| `quiz_attempts.idempotency_key` | UUID NULL | `Idempotency-Key`；依會員唯一，NULL 僅供遷移前／相容舊紀錄 |
| `quiz_attempts.idempotency_fingerprint` | BYTEA NULL | SHA-256 32 bytes；必須與 key 同時為 NULL 或同時有值 |
| `quiz_attempt_questions.attempt_id`, `ordinal` | UUID, SMALLINT | 複合主鍵；每次 attempt 的第幾題 |
| `quiz_attempt_questions.question_id` | BIGINT FK | 原始題目 ID；另有 attempt 內唯一 constraint |
| `prompt_snapshot`, `choices_snapshot`, `answer_mode_snapshot` | TEXT, JSONB, VARCHAR(10) | 作答當下題目快照 |
| `correct_choices_snapshot`, `selected_choices` | JSONB, JSONB | 正解只給後端判分；會員選取只保存該題最新版本 |
| `user_skill_completions.user_id`, `skill_id` | BIGINT, VARCHAR(80) | 複合主鍵；每會員每技能只永久完成一次 |
| `first_passed_attempt_id` | UUID FK | 複合 FK 確保是同會員、同技能的 attempt |
| `user_progress_revisions.revision` | BIGINT | 首次插入 completion 才加 1，重試或重考不加 |
| `xp_outbox.event_id` | UUID PK | 消費端冪等識別碼 |
| `xp_outbox.user_id`, `source_type`, `source_id`, `event_type` | BIGINT, VARCHAR(40), VARCHAR(128), VARCHAR(80) | 自然唯一鍵為後三欄；首通值固定見下方 |
| `xp_outbox.amount` | INTEGER NULL | 新 event 不帶獎勵值；D 算出來的實際數量寫入 ledger |
| `xp_outbox.payload` | JSONB | 只放 `skillId`、`attemptId`、`catalogVersion`、`completedAt` |
| `xp_outbox.status`, `attempts`, `available_at` | VARCHAR(20), INTEGER, TIMESTAMPTZ | pending／processing／completed／failed、已 claim 次數與下次可處理時間 |
| `xp_outbox.lease_token`, `lease_expires_at` | UUID NULL, TIMESTAMPTZ NULL | processing worker fence；兩欄必須同時為 NULL 或同時有值 |
| `xp_ledger.event_id` | UUID UNIQUE FK | 一個 outbox event 最多一筆實際入帳 |
| `xp_ledger.amount` | INTEGER | D 計算的實際獎勵，必須大於 0 |

## 重要資料不變條件

- BIGINT IDs 在 API 中使用十進位字串；會員身份來自有效的 HttpOnly session cookie，不來自請求本文的 `userId`。
- 會員完成技能時，C 必須在同一 transaction 確認 attempt 屬於目前會員、技能一致且 `passed = true`，再呼叫 E 的 `recordSkillCompletion`。
- 正式題庫查詢只取 `active`、`published`、未軟刪除、非展示題，且技能與分類都啟用的題目。
- 題庫答案索引必須是選項範圍內不重複的整數。資料庫 constraints 與 API 驗證雙重保護；單選相容欄位不可取代 `correct_choices`。
- `GET /api/skills` 與 `GET /api/progress` 使用相同條件計算 `catalogVersion`。會員 progress 只回目前會員的完成 ID 和 revision。
- `npm run db:question-coverage` 分別列出一般正式題數與 C 首版可用題數；C MVP 技能須至少有 5 道符合其單選三選項規格的題目。官方 MVP `skillId` 清單待 C 確認；展示 seed 不算正式題庫。

## 測驗、學習歷史與冪等規則

- B×C 已在 GitHub [整合討論 #1](https://github.com/Coding-Skill-Tree/Skill-Tree/issues/1) 定案使用 B 的 `skillId`。API JSON 一律使用 `skillId`；資料庫外鍵一律使用 `skill_id`。不要同時接受 `skillId` 和 `skillNodeId` 兩種公開名稱。
- `quiz_attempts` 是測驗歷史唯一資料來源；`quiz_attempt_questions` 保存每次作答時題目、選項、正解及會員選取的快照。C 的測驗歷史 API 讀這兩張表，不建立另一張 `quiz_history`。
- `skill_title_snapshot` 在建立測驗時複製當下的技能名稱，歷史畫面不會因 B 後續改名而變動。migration 對既有 attempt 以套用當下的技能名稱回填。
- `user_skill_completions` 是目前永久通過狀態，不是第二份測驗歷史。首次通過的 attempt 必須屬於同一會員及 `skillId`，且已結算為通過；同一 `(user_id, skill_id)` 只保留最早的通過紀錄。
- `user_learning_activity_history` 是唯讀 view，將每筆已完成 attempt 映射成一筆 `quiz_attempt` 學習活動。進行中及取消的測驗不列入；首次通過紀錄不再額外產生一筆重複活動。D 的 `GET /api/progress/history` 從此 view 讀取、以 session 的 user ID 限定範圍。
- 歷史 API 用 keyset pagination，排序鍵為 `completed_at DESC, activity_id DESC`；cursor 需同時攜帶時間及 attempt UUID。每筆歷史活動的 ID 就是 `attemptId`，技能欄位是 `skillId`，結果由 `correct_count`、`total_questions`、`passed` 組成，不另存百分比。
- 若之後新增非測驗學習活動，由該活動所屬模組維護自己的來源紀錄，再擴充歷史 view；不得把 C 的 attempt 複製到另一張泛用 history table。

### 寫入冪等與交易邊界

| 操作 | 冪等規則 | 衝突與交易 |
| --- | --- | --- |
| 建立測驗 | C 的 `POST /api/quizzes/attempts` 必須帶 UUID 格式的 `Idempotency-Key`。資料庫以 `(user_id, idempotency_key)` 唯一；fingerprint 是 canonical 請求本文的 SHA-256 32-byte 值。相同會員、key 和 fingerprint 重送時回傳同一個 attempt 及原題目快照。 | E migration 提供欄位／唯一索引；C PR #93 的首次建立回 `201`，相同 key/body 重送回 `200`；相同 key 但 fingerprint 不同回 `409 IDEMPOTENCY_KEY_CONFLICT`。會員 ID 取 session；attempt、五題快照和 key 在同一 transaction 建立。取消後沿用舊 key 仍回原 `cancelled` attempt；開始新測驗使用新 key。C router 尚待合併至 E app 並做 live DB 整合，詳見[Idempotency-Key 使用說明](idempotency-key-guide.md)。 |
| 儲存答案 | 每題由 `(attempt_id, ordinal)` 唯一定位；C 確認提交後不可修改，返回前題僅供檢視。 | 答案提交 route 尚待 C 實作；只有 attempt 所屬會員可寫入，完成後不得再改答案。重複提交相同答案的回應仍需由 C route 契約明確定義。 |
| 結算測驗 | 交易鎖定 attempt，只允許 `in_progress → completed` 一次；分數以資料庫快照和已保存答案重算。重送結算回傳既有結果，不重新判分。 | 完成狀態、分數、永久完成紀錄、revision 和首通 XP event 在同一 transaction 提交，避免只寫入其中一部分。 |
| 建立首通 XP event | 只在 `user_skill_completions` 首次插入成功時呼叫 `enqueueSkillFirstPassXpEvent()`。event 自帶 UUID，固定 `source_type=quiz_attempt`、`source_id=attemptId`、`event_type=skill.first_pass`，payload 含 `skillId`、`attemptId`、`catalogVersion`、`completedAt`。 | 同自然鍵的同 payload 視為重送；同自然鍵但 user／skill／來源資料不一致屬資料衝突，不覆寫舊 event。事件與首次完成在同一 transaction。 |
| 消費 XP event | D 以 `FOR UPDATE SKIP LOCKED` claim；每次 claim 寫入隨機 `lease_token` 和到期時間。確認、失敗回報都必須比對當前 lease token。 | lease 過期可重領；舊 worker 因 token 不同不能確認新 worker 的工作。實際加分與標記 event completed 同一 transaction，`xp_ledger.event_id` 唯一，重送不重複加分。 |

XP Outbox 是「首通事件」，不預先假設獎勵點數。新事件的 `amount` 留空，由 D 依活動類型和技能規則計算；實際發放數量只寫入 `xp_ledger.amount`。既有非空 `amount` 僅為相容舊資料。

Outbox 消費端讀取欄位時組成 `{ eventId, userId, sourceType, sourceId, eventType, payload }`；`userId` 來自資料列，payload 僅含 `skillId`、`attemptId`、`catalogVersion`、`completedAt`。會員 Email、姓名、cookie、答案和題目正解不進入事件 payload。

Worker 每次 claim 都增加 `attempts`。D 尚需和 E 定案重試間隔、lease 長度與最大嘗試次數；目前的候選方案是 full-jitter 指數退避（5 秒起、上限 1 小時）、最多 claim 12 次。定案前，候選值不可視為正式契約。到達上限的事件須保留供管理員檢查；過期 processing lease 若已到上限，不再自動執行發獎。

`quiz_attempts_completed_result_required` 以 `NOT VALID` 加入，確保新建立或更新成 completed 的 attempt 一定有完成時間、答對數和通過結果；舊資料不會因 migration 自動中斷。正式驗收前需盤點舊 completed rows，再修復或驗證此 constraint。

## 重要索引

- Email 唯一索引及不分大小寫暱稱唯一索引。
- Session token 雜湊唯一索引與會員／管理員到期查詢索引。
- 技能分類啟用排序索引、題目前置關係複合主鍵。
- 題目技能／啟用、管理列表狀態／更新時間，以及非展示已發布題庫索引。
- 測驗會員歷史／完成時間、進行中 attempt、XP pending／過期 lease outbox 和會員 XP ledger 查詢索引。

## 尚待模組確認

- B 已確認標準識別名稱為 `skillId`；正式技能清單、分類、排序、目錄版本更新方式及停用技能的進度顯示仍由 B 提供。
- C 負責在共用 Express 實作測驗 endpoints；必須遵守本文件的 attempt 快照、答案不可外洩、結算交易和建立冪等 key 規則。
- D 負責 XP event 消費、獎勵金額、重試上限／間隔、等級計算及展示欄位；Outbox 已提供 lease 與 fencing 欄位。`member_profiles.level` 目前只有預設值 `1`，尚無等級門檻資料；目前也沒有成就定義／取得紀錄表。需要這些資料時由 D 提 migration 與唯一性規則，避免拿既有表存放不同業務概念。
- A 確認會員 profile 欄位、註冊後直接進 onboarding、歡迎信及密碼重設畫面行為。新註冊不經 Email 驗證連結。
