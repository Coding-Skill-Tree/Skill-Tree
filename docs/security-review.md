# Skill Tree 資安檢查與部署規則

檢查日期：2026-11-28。這是依遠端 `main`（`c814544`）重播後的 `codex/e-integration-pr` 候選分支原始碼與設定進行的靜態檢查，不是對正式站或資料庫執行的滲透測試。未讀取或複製本機 `backend/.env`；該檔已由 Git 與 Docker 忽略。追蹤中的環境設定檔與目前程式碼未發現憑證值。GitHub 原始碼庫是公開的，請假設所有已追蹤檔案和歷史提交都能被任何人讀取。

## 本次已加入的防護

- 會員和管理員各自使用隨機伺服器端 session token；資料庫只存 SHA-256 摘要。Cookie 設定 `HttpOnly`、`SameSite=Lax`、host-only，正式環境使用 `Secure`。
- 管理員分為 `owner` 和 `editor`。既有帳號遷移後預設為 `editor`，資料庫只允許一位啟用中的 owner，沒有公開管理員註冊。owner 可查看組員並停用／恢復 editor；停用會撤銷該帳號的現有 session。建立帳號和移交 owner 權限需在可信任主機使用 migration credential，不經 API runtime credential。
- `/demo` 是匿名唯讀展示頁，只載入包在前端的示範技能圖，不載入帳號、不保存進度，也不呼叫寫入 API。匿名 API 僅開放安全的公開路由，例如技能目錄；會員和管理資料仍需各自的 session。
- API 加入每個 Node 程序自己的頻率限制：一般 API 每個來源位址每分鐘 300 次；登入與密碼重設每分鐘 20 次。既有資料庫登入失敗冷卻仍保留。超限回應 `429` 和 `Retry-After`，記憶體中的計數器有上限。
- API 回應設為 `no-store`；加入 API／文件 CSP、`nosniff`、禁止 iframe、`no-referrer`、Permissions Policy，以及正式環境 HSTS。JSON request body 上限為 64 KiB。
- 正式環境拒絕 `DATABASE_SSL=false`。資料庫 migration 和初始管理員建立使用 `DATABASE_MIGRATION_URL`；API 使用獨立的 `DATABASE_URL`。
- `backend/deploy/grant-runtime-role.sql` 建立非資料庫 owner 的 `skill_tree_runtime`，只授予目前 API 查詢所需的資料表及欄位權限；不可執行 DDL、修改 migration 紀錄、建立管理員、變更管理員角色、清空資料表，或存取未明確授權的新資料表。
- 正式 SMTP 若使用 STARTTLS 連線，會強制升級為 TLS；若 SMTP 未支援 TLS，寄信會失敗，不會以明文傳送憑證或密碼重設碼。
- 密碼重設使用 6 位數、10 分鐘有效的一次性碼；資料庫只存 `EMAIL_CODE_SECRET` HMAC 摘要，錯誤最多 5 次。production secret store 必須提供至少 32 字元的 `EMAIL_CODE_SECRET`。開發環境未設定 SMTP 時，驗證碼只會顯示在本機 API 終端機。
- 依目前小組驗證流程，新註冊會直接把 `email_verified_at` 設為建立時間並建立 session，不寄驗證信；這表示系統沒有確認註冊者實際控制該信箱。此行為是本 PR 的明確需求，若要存放真實會員資料或公開招生，必須先恢復信箱所有權驗證或採用等效措施。
- `backend/deploy/grant-runtime-role.sql` 已列出目前會員／管理 API 權限，以及 C 測驗路由整合預備所需的 attempt/snapshot 欄位權限；C PR #93 尚未掛到此 app。這份 SQL 只在部署者手動執行後才會影響資料庫，本次沒有執行或驗證線上 grants。D 的 XP worker 角色和資料庫權限尚未建立。

## 身份與權限

| 身份 | 權限 |
| --- | --- |
| 專案負責人／應用程式 owner | GitHub 管理權限與唯一的應用程式 `owner` 帳號 |
| 專案組員 | GitHub `Write` 與應用程式 `editor`；可查看會員資料和編輯題庫，不能管理組員存取權 |
| 新加入的公開訪客 | 可查看公開原始碼與公開網站，沒有 GitHub 寫入權、會員資料或管理 API 權限 |
| 老師／展示訪客 | 匿名查看 `/demo` 的本機靜態範例；無須登入或共用密碼，無法看到會員資料或寫入伺服器 |
| 註冊會員 | 只能透過已驗證的會員 session 存取自己的會員資料和進度 |

只在可信任主機使用 migration credential 建立組員帳號：`npm run admin:create -- <username> editor`。建立第一位 owner：`npm run admin:create -- <your_username> owner`。migration 011 套用後，如需移交最高管理權，執行 `npm run admin:transfer-owner -- <username>`，並使用具權限的 `DATABASE_MIGRATION_URL`。不要把所有管理員都提升為 owner。唯一啟用 owner 的索引會拒絕第二位 owner。絕不可把 `DATABASE_MIGRATION_URL` 放進 API 執行環境或瀏覽器建置檔。

正式資料庫先使用 `DATABASE_MIGRATION_URL` 套用 migration，再由具有 `CREATEROLE` 權限的資料庫管理員執行：`psql "$DATABASE_MIGRATION_URL" -v ON_ERROR_STOP=1 -f backend/deploy/grant-runtime-role.sql`。接著在隱藏輸入的 `psql` 提示中設定 runtime 密碼；把密碼存於託管平台的 secret store，並讓 API 的 `DATABASE_URL` 使用 runtime role。新增資料表或新 API 寫入流程時，要審查並更新最小權限清單。不可把資料庫 owner 或 migration 權限交給 API runtime role。

## 程式碼檢查結果

- **身份驗證：** 新註冊帳號建立後可登入並收到歡迎信；未知帳號登入會執行 dummy password hash；登入失敗依雜湊帳號識別碼節流。密碼重設碼具短期限、單次使用與錯誤次數上限；重設密碼後撤銷會員 session。
- **權限控管：** 會員 API 從 session 推導 user ID；管理 API 使用獨立管理員 session；帳號與題庫變更有欄位驗證，SQL 使用參數化查詢。owner/editor 權限由 API 強制檢查，不依賴 React 隱藏按鈕。
- **輸入驗證：** 設有 JSON 大小上限、路由層型別／長度／範圍驗證、參數化 SQL、固定排序欄位和有界分頁。未發現由使用者輸入組合動態 SQL 的程式。
- **前端風險：** 目前主應用的 React 畫面以 React 預設文字跳脫輸出；未找到 `dangerouslySetInnerHTML`、`eval` 或瀏覽器端資料庫憑證。API Explorer 使用 `innerHTML`，但插入前會跳脫動態文字，且正式環境不提供該文件路由。
- **部署設定：** 正式 API 不提供 OpenAPI／API 文件；`.env` 已由 Git 和 Docker 忽略；正式環境的 `APP_ORIGINS` 必須使用 HTTPS，郵件連結的 `PUBLIC_APP_URL` 也必須使用 HTTPS。

## 正式網站上線前必須完成

1. 設定 `NODE_ENV=production`、`DATABASE_SSL=true`、只含 HTTPS 網址的 `APP_ORIGINS`、HTTPS `PUBLIC_APP_URL` 和 SMTP secrets。只有 API 確認只能經過指定可信任 proxy chain 存取時，才設定非零 `TRUST_PROXY_HOPS`。runtime 與 migration 資料庫帳密必須分開。
2. 套用到 migration 012、建立或移交唯一 owner、逐一建立 editor，並以資料庫管理員執行 runtime role SQL。確認只有部署工作持有 migration credential，web 程序沒有該憑證。C routes 合併前再次核對 attempt/snapshot 欄位 grants；D worker 上線前另設專用 worker role 和最小權限。
3. 在 CDN 或反向代理另設跨程序／跨主機共用的頻率限制。程式內計數器只保護單一 Node 程序；多個副本不共用計數。proxy 應涵蓋全部 `/api/*`，並對 `/api/auth/*` 和 `/api/admin/auth/*` 設更嚴格限制。
4. 在 GitHub repository settings 確認公開庫只給負責人 `Admin`、可信任組員 `Write`，其他人不給寫入權。保護 `main`：使用 PR、至少一人核准、必要 CI 檢查、禁止強推／刪除，並避免例行 bypass。請直接檢查 rulesets 與協作者名單；目前 GitHub connector 只提供 repository metadata，無法讀取這些設定。
5. 啟用 dependency graph、Dependabot alerts／updates、secret scanning 與 push protection、code scanning。這次沒有執行依賴套件安全公告掃描，因為需要外部公告資料；上線前請檢查 GitHub alerts。若發現已提交的真實憑證，先撤銷／輪替，單純刪檔或改寫歷史不會讓憑證失效。
6. 前端只透過 HTTPS 提供，並在實際主機設定 HTTP CSP，包含 `frame-ancestors 'none'`，以及 `public/_headers` 中的其他 headers。此 repo 未記錄實際前端託管平台，尚未檢查部署後回應 headers。
7. 為 GitHub 負責人與組員啟用 MFA；在儲存真實學員資料前，為應用程式管理員加入 MFA。並檢查託管平台的資料庫網路白名單、備份、資料保留、日誌及告警。

## 尚未在本次檢查中確認的風險

- 程式內的頻率限制是單程序版本；正式環境仍需上游共用 limiter。
- 本次只靜態檢查程式與設定，沒有連線正式站或資料庫。資料庫 grants、CDN policy、GitHub branch rules、協作者名單、secret-scanning 狀態和 CI 安全檢查結果，都沒有在此更改或驗證。
- 會員 Email 和個人資料存在 PostgreSQL；目前沒有欄位層級加密或資料列層級 RLS。應用程式依 session／角色限制每位使用者可存取的資料，但 runtime role 本身能讀取 API 功能所需的整體資料集。正式資料庫需確認磁碟與備份加密、網路白名單、存取稽核；若要資料庫自行強制列級隔離，需另外設計並測試 RLS。
- 新會員在沒有信箱驗證的情況下被標為已驗證。有人可用別人的 Email 建立帳號，可能造成冒名和密碼重設寄送問題；此決策目前服務於小組直接進入下一個測試環節，不應視為公開產品的安全預設。
- 會員密碼目前允許 8–25 位英文字母／數字。真實會員帳號累積重要個資前，應改用較長密語政策並為管理員加入 MFA。
- 追蹤檔案與此 checkout 可見的 Git refs 曾做有限 secret 檢查。仍需確認 GitHub secret scanning 的歷史結果；若掃描發現憑證，立即輪替。
- 有一個未使用的舊通知 prototype 內含第三方 worker 網址，未被目前主應用路由載入。重新接回前，需重新審查其資料傳送目的並移除或明確核准該整合。
- 舊管理介面 prototype 仍引用瀏覽器 sessionStorage 假 API；目前主應用未掛載這些頁面。不要把它們接回正式會員／管理路由，重新使用前需改接真實後端 session 與權限檢查。

## 參考資料

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP Database Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub repository security settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository)
- [GitHub rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Nodemailer SMTP TLS settings](https://nodemailer.com/smtp)
