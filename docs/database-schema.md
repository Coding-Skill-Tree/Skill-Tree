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

## 資料表與關聯

| 資料表 | 核心內容 | 關聯與責任 |
| --- | --- | --- |
| `users` | Email、密碼雜湊、驗證及停權時間 | A 管理帳號生命週期；E 管理身份 Schema |
| `member_profiles` | 暱稱、頭像、學習路線、onboarding、角色及等級 | 一位 user 對一筆 profile；會員只能由 `sid` 對應的 user 更新 |
| `member_sessions` | session token 雜湊、會員及到期時間 | token 只保存雜湊；停權或登出撤銷 session |
| `email_tokens` | Email 驗證／密碼重設用途、雜湊、到期與使用時間 | token 一次性使用；不保存原始 token |
| `member_auth_identities` | Google provider subject 與會員關聯 | OAuth 流程尚未實作；此表只記錄已確認的 identity link |
| `admin_accounts`, `admin_sessions` | 獨立後台帳號與 session | 管理員身份不與會員 session 混用 |
| `admin_audit_log` | 管理員動作、目標及 metadata | 會員停權／恢復及題目維護操作留存稽核紀錄 |
| `auth_rate_limits` | scope、雜湊 subject、失敗數、冷卻與寄送節流 | 不以 Email 明文作 rate-limit key |
| `skill_categories` | 技能分類名稱、排序、啟用狀態 | B 確認正式分類及排序 |
| `skills` | `skillId`、分類、學習內容、座標、catalog version、排序、啟用狀態 | B 提供正式目錄；E 維護儲存與讀取契約 |
| `skill_prerequisites` | 技能節點間先修關係 | 複合主鍵避免同一關係重複；B 負責畫面解鎖判斷 |
| `questions` | 題目、技能、選項、答案索引、解析、難度、發布／刪除狀態 | E 管理題庫資料；C 確認取題及作答快照格式 |
| `quiz_attempts` | 會員、技能、目錄版本、測驗狀態及結果 | C 負責開始、抽題、判分與歷史；題數依 C 核定的測驗契約 |
| `quiz_attempt_questions` | 題目及作答時內容快照、正解和會員選取 | 不受後續編輯題目影響；答案資料只能在可信任 backend 使用 |
| `user_skill_completions` | 會員首次通過某技能的 attempt 與完成時間 | 唯一鍵 `(user_id, skill_id)` 保證同技能只完成一次 |
| `user_progress_revisions` | 每位會員的進度版本 | 首次新增完成紀錄時加一；重複提交不增加 |
| `xp_outbox` | 待處理 XP event、來源、金額、狀態及重試資訊 | C 提供來源事件；D 負責計算／發放／重試處理 |
| `xp_ledger` | 已發放 XP 的不可重複帳本 | event ID 唯一；D 擁有遊戲化規則，E 提供持久化 |
| `schema_migrations` | migration 檔名、checksum、套用時間 | migration runner 管理，不由應用程式直接寫入 |

## 重要資料不變條件

- BIGINT IDs 在 API 中使用十進位字串；會員身份來自有效的 HttpOnly session cookie，不來自請求本文的 `userId`。
- 會員完成技能時，C 必須在同一 transaction 確認 attempt 屬於目前會員、技能一致且 `passed = true`，再呼叫 E 的 `recordSkillCompletion`。
- 正式題庫查詢只取 `active`、`published`、未軟刪除、非展示題，且技能與分類都啟用的題目。
- 題庫答案索引必須是選項範圍內不重複的整數。資料庫 constraints 與 API 驗證雙重保護；單選相容欄位不可取代 `correct_choices`。
- `GET /api/skills` 與 `GET /api/progress` 使用相同條件計算 `catalogVersion`。會員 progress 只回目前會員的完成 ID 和 revision。
- `npm run db:question-coverage` 以每個 active skill 至少 5 道正式題目作檢查；展示 seed 不算正式題庫。

## 重要索引

- Email 唯一索引及不分大小寫暱稱唯一索引。
- Session token 雜湊唯一索引與會員／管理員到期查詢索引。
- 技能分類啟用排序索引、題目前置關係複合主鍵。
- 題目技能／啟用、管理列表狀態／更新時間，以及非展示已發布題庫索引。
- 測驗會員歷史、進行中 attempt、XP pending outbox 和會員 XP ledger 查詢索引。

## 尚待模組確認

- B 確認正式技能 ID、分類、排序、目錄版本更新方式及停用技能的進度顯示。
- C 確認測驗端點契約與題目快照欄位；C 的 routes 在共用 Express 中呼叫 E backend-only repository，答案不得回傳瀏覽器。
- D 確認 XP event type、冪等來源 ID、outbox worker／retry policy、等級計算及展示欄位。
- A 確認會員 profile 欄位與註冊、Email 驗證、onboarding 及密碼重設畫面行為。
