# Skill Tree｜登入與註冊

React + Vite。執行 `npm install`、`npm run dev`；正式建置 `npm run build`。

- `#/login`（預設）與 `#/register`：原生 hash 路由，支援瀏覽器上一頁、下一頁、重新整理。
- `AuthHeader.jsx` 共用導覽列；`LoginPage.jsx`、`RegisterPage.jsx` 各自管理表單。
- 保留登入頁垂直置中及原始註冊頁版型；各自 CSS 與 RWD。
- 密碼顯示／隱藏，切換頁面會卸載表單，不儲存或傳送資料。
- Google、忘記密碼、提交僅為 UI，尚未串接 API。
- 整合主專案時，可將兩個頁面與共用 Header 改由既有路由管理，並將 hash 連結改為專案的路徑。

- V4：登入表單與註冊表單使用相同響應式寬度、字級、輸入欄位尺寸，登入標題改用無背景的 legend。

- V5：共用 Header 登入／註冊按鈕略微放大（桌機最小 50 × 34px、字級 13px）。
