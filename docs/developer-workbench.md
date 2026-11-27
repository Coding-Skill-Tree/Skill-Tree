# 前後端開發工作台

本專案提供兩個目的不同的本機工具：

- `/workbench`：用資料流視覺圖、OpenAPI、migration 狀態和白名單原始碼，理解「畫面呼叫哪支 API、後端在哪裡處理、資料如何進資料庫」。此頁只送 GET。
- `/api/docs`：互動式 API Explorer，可實際呼叫 OpenAPI 中列出的端點。POST、PUT、PATCH、DELETE 和登入請求可能改變本機資料或建立 session。

前端 UI 和後端 repo 都以程式碼為準；工作台提供導覽與可查證的本機狀態，不會取代程式碼 review、API 測試或真實模組驗收。

## 為什麼做這個工具

市場上的工具已能處理其中幾段：

- [Swagger UI](https://swagger.io/tools/swagger-ui/) 依 OpenAPI 顯示文件並提供互動式 API 操作。
- [Stoplight Elements](https://stoplight.io/open-source/elements) 可將 OpenAPI 文件嵌入產品文件，並提供互動式 API 參考。
- [Postman Flows](https://learning.postman.com/docs/postman-flows/overview/) 用畫布和節點連接 API workflow；[Postman Visualizer](https://learning.postman.com/docs/sending-requests/response-data/visualizer/) 可把 response data 呈現成自訂視覺結果。

這些工具適合 API 文件、請求測試或 workflow 視覺化。本次查到的代表性工具沒有直接把本專案 React → Express middleware → route/service → migration 的原始碼位置，和本機資料庫連線／migration 套用狀態放在同一個、針對團隊新手設計的安全視窗。因此工作台選擇沿用現有 OpenAPI，不增加新的 runtime 套件，再補上本專案專屬的程式碼連結和資料流畫面。這是依本次查到的產品功能做的設計判斷，不代表市場上不存在其他相近工具。

## 頁面會讀什麼

| 區塊 | 讀取來源 | 用途 |
| --- | --- | --- |
| API / PostgreSQL 狀態 | `GET /api/health` | 顯示 API 是否可回應、DB 是否 connected。 |
| API routes | `GET /api/openapi.json` | 顯示已登錄的 method、path、描述和登入需求。 |
| Migration 狀態 | `GET /api/dev/workbench/status` | 顯示 `schema_migrations` 的檔名和套用時間，不回 checksum 或業務資料。 |
| 原始碼 | `GET /api/dev/workbench/sources/:sourceId` | 只讀固定白名單中的特定檔案；畫面使用文字節點顯示程式碼。 |

白名單包含前端 API client／測驗 adapter、工作台 UI、Express app、測驗 routes、題庫 service、學習歷史 route、migration 010 和 API 契約。工作台沒有任意 filepath 參數，也不提供任意 SQL、會員記錄、session、環境變數或密碼讀取。

## 安全限制

- React 路由只在 Vite 開發模式註冊；後端來源碼和 migration API 在 production 不掛載。
- Source ID 對應固定相對路徑，拒絕不在白名單的 ID；同時確認檔案解析後仍位於專案目錄，且單檔不超過 48 KiB。
- 工作台所有 API 都是 GET；回應使用 `Cache-Control: no-store`。它不會在載入時執行使用者指定的 API 請求。
- 程式碼以 React `<pre>` 的文字內容呈現，不以 `innerHTML` 執行或插入讀取到的程式碼。
- `/api/docs` 是另一個互動工具，不能和只讀工作台混為一談。僅在本機測試資料庫使用，寫入或登入操作前先確認選中的 endpoint。

如果後續要顯示更多資訊，先新增固定 source ID 和明確欄位，再補測試。不要接受前端傳入的檔案路徑、SQL、環境變數名稱或任意資料表名稱。
