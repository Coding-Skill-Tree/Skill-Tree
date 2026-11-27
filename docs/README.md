# Skill Tree 文件索引

第一次接觸專案時，先看快速開始指南，再按你正在處理的工作讀對應文件。遇到欄位名稱或登入規則不一致時，以 API 契約和 migration 為準。

## 第一次使用

1. [組員快速開始指南](quick-start-for-teammates.md)：從取得程式碼、啟動本機服務，到用驗收頁確認 API。
2. [後端與資料庫上手指南](backend-onboarding.md)：安裝 Node/PostgreSQL、設定 `.env`、套用 migration、建立管理員、測 API 和獨立測試資料庫。
3. [團隊後端整合與驗收手冊](team-backend-integration-guide.md)：A–E 資料責任、目前整合狀態、各模組串接步驟和常見問題。

## 實作時查閱

| 文件 | 什麼時候看 |
| --- | --- |
| [API 契約 v1](api-contract.md) | 寫前端 adapter 或 API route 前；查 URL、身份、欄位、錯誤格式和目前已實作範圍。 |
| [PostgreSQL Schema 概覽](database-schema.md) | 新增或讀取資料前；查資料表、關聯、migration 及資料責任。 |
| [題庫規劃與審查指南](question-bank-plan.md) | 編寫、審查或發布正式題目時；查題數門檻、來源追溯和編輯流程。 |
| [C 測驗 API 整合紀錄](quiz-api-integration.md) | 對照 C PR #86、查冪等與正解保護處理，或準備 C review。 |
| [開發工作台設計與安全範圍](developer-workbench.md) | 用 `/workbench` 追蹤畫面到資料庫的資料流，或確認它讀取哪些本機資訊。 |
| [共用後端架構圖](images/backend-architecture.svg) | 快速掌握 A–E 共用服務和仍待接線的模組。 |
| [本機工作台資料流圖](images/dev-workbench-flow.svg) | 查看工作台的讀取流程和程式碼檢視邊界。 |

## 先知道的範圍

- API 成功使用 `{ success: true, data }`；錯誤使用 `{ success: false, error }`。前端走 `src/services/api.js`，不要在畫面元件自行重做 cookie 或錯誤解析。
- 題庫管理 API 會包含正解，只供管理員使用。會員測驗建立與題目快照讀取已接入；答案提交、結算和測驗歷史 routes 尚待 C 完成。
- `/api/docs` 是可實際送出 API 請求的互動文件；POST、PUT、PATCH、DELETE 可能改動資料。用自己的本機測試資料庫。
- `/acceptance` 和 `/workbench` 只在 Vite 開發模式提供。驗收結果要看實際 HTTP 回應或獨立測試紀錄，文件上的舊紀錄不會自動證明新 commit 通過。
- `.env`、密碼、session cookie、驗證 token 和資料庫 dump 不得提交或貼到截圖／Issue。
