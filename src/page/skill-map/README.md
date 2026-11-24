# Skill Tree — React 開發版 v0.3

保留前一版 HTML/CSS 與 RWD 的深色介面，將 V2.1 的 5 大技能、26 個單元、132 個節點轉為 React 資料驅動畫面。

## 啟動方式

需要 Node.js 18+（建議 22 LTS）與 npm。解壓縮後，在 VS Code 終端機進入專案根目錄（包含 package.json 的資料夾）：

```bash
npm install
npm run dev
```

開啟終端機輸出的本機網址，通常為 http://localhost:5173 。

```bash
npm test        # Node 內建測試，不須安裝第三方套件
npm run build   # 產生 dist/ 靜態部署檔案
npm run preview # 預覽 build 產物
```

## 操作流程

1. 選擇 HTML、CSS、JavaScript、React、Git；五條路線獨立開放。
2. 點選節點查看右側任務資訊；鎖定節點也可查看，但不能開始。
3. 點擊「開始學習」後，節點變為進行中。選擇「稍後繼續」會保留進行中狀態。
4. 在示範視窗選擇「模擬完成」，完成節點、取得示範 XP 並自動選取下一個已解鎖節點。
5. 切到其他技能或切換地圖/清單檢視，已完成紀錄不受影響。
6. 重設進度會在確認後清除五條路線的本機紀錄。

## 本階段規則（暫定）

- 每個技能只有第一個節點初始可用，技能內依前一節點完成與否循序解鎖。
- 所有節點狀態來自唯一的 progress 物件，進度百分比、XP 與等級均為衍生值，不重複存放。
- 一般節點 100 XP，單元挑戰 150 XP，最終挑戰 200 XP；每累積 500 XP 升一級，從 Lv. 1 開始。全通關總 XP 14,750。
- 星星只是示範完成標記（完成即三星），不代表答題正確率；任務面板顯示節點完成度而非能力掌握度。
- localStorage key：`skill-tree:progress:v1`；同一瀏覽器與網頁來源保存一份進度，不會跨帳號或裝置同步。
- 重新整理後預設開啟 HTML 並選取下一個可學習節點；本次工作中的各技能選取節點也會在切換時保留。

## 專案結構

```
src/
  App.jsx                  # 主頁狀態、互動流程
  main.jsx                 # React 入口
  style.css                # 原版視覺與 RWD + 動態樣式
  components/
    Sidebar.jsx            # 側邊欄與總 XP
    SkillSelector.jsx      # 五大技能選擇
    SkillMap.jsx           # 地圖、清單切換與統計
    SkillUnit.jsx          # 單元
    SkillNode.jsx          # 可重用節點
    TaskPanel.jsx          # 選取節點詳細資訊
    ProgressBar.jsx        # 進度條
    LearningDialog.jsx     # 示範通關視窗
    Icon.jsx               # SVG 圖示
  data/skills.js           # 共用課程資料（對應 V2.1）
  hooks/useProgress.js     # React state 與 localStorage
  lib/progress.js         # 純函式：狀態、解鎖、XP、統計
tests/progress.test.js     # 自動化規則測試
```

## 後續串接題庫

在 `LearningDialog` 替換示範流程（選擇題、填空或實作），提交答案給題庫服務，服務確認通關後才呼叫 `complete`。正式版由後端驗證先修條件、判分、發放 XP，不能信任 localStorage 作為正式學習成績。側邊欄其他頁面、會員、成就與題庫仍待開發。

## 驗證範圍

- `npm test` 五項測試通過，含完整 132 節點通關、節點 ID/關聯、重複領取 XP 防護、錯誤進度清理。
- 瀏覽器使用 React 18.2.0 本機執行環境，檢查技能切換、鎖定節點、示範完成及取消、地圖/清單切換、重設、進度儲存/重載邏輯（以模擬 localStorage 測試）；六種視窗寬度 320–1648px 無整頁橫向溢出。
- 本環境 npm registry 無法連線，故尚未執行 Vite 的 npm install / npm run build；專案需在有 npm 網路的環境安裝後再次確認。真實瀏覽器跨次重載儲存與實機/跨瀏覽器測試仍待確認。
- 另外提供單檔 React 預覽 HTML，內含本機 React 18.2.0 runtime 與同份應用程式碼，可獨立檢視；若直接開啟本機 HTML 時瀏覽器限制 localStorage，建議以 Live Server 啟動預覽檔案。
