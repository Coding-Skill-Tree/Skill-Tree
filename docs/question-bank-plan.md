# Skill Tree｜題庫來源與展示題組規劃草案

> 狀態：內容規劃草案，2026-11-26。展示題用來呈現題目情境與解析方式，不是正式課程題庫，也不計入正式題庫覆蓋率。

## 1. 規劃目標

先用少量、可直接映射目前資料契約的展示題呈現學習體驗；正式題目則依技能節點和學習目標找權威資料、重新編寫、審查後再擴充。來源文件用來核對技術正確性，不把教材原題或答案整批搬進題庫。

展示題的「題型」分成兩層：

- **作答方式**：現有資料格式支援單選 `single`、多選 `multiple`。
- **學習情境**：概念辨認、程式結果推演、情境判斷、除錯和規格理解。這些是題目內容標籤，不是資料庫已支援的新互動元件。

排序、配對、填空、程式碼執行與自由作答需要額外的 UI、答案格式、評分和安全規則，先列作未來功能，不混入本次展示題。

## 2. 目前專案基線

- 開發 seed 有 15 個技能節點。`html-basics` 已有 8 道 `is_demo=true` 的單選展示題；它們不算正式題庫。
- 目前題目契約有 `skillId`、`prompt`、`answerMode`、`choices`、`choiceExplanations`、`correctChoices`、`explanation`、`difficulty`、`status`；選項數量為 2–10。
- 題目來源、作者、授權和最後核對日期目前沒有題目欄位保存，擴正式題庫時需要另外保存來源紀錄。
- 文件門檻有一處尚未對齊：目前 API 契約寫每個啟用技能至少 5 道正式題；C 模組交接稿寫每節點至少 8 道、每次抽 5 題且答對 4 題通過。擴大量產前請 B/C/E 確認採用的最低題量和測驗規則。本草案以「8 題作為規劃目標、5 題作為目前 API 契約門檻」估算，尚非團隊決議。

## 3. 展示題組（提案）

下列 8 題跨 HTML、CSS、JavaScript、Git 和 HTTP，展示單選、多選、程式閱讀、情境判斷和除錯。答案與解析供審稿；匯入 seed 前仍應由內容負責人核對。

### D-01｜表單標籤關聯

- `skillId`: `html-forms`；情境：程式閱讀；方式：單選；難度：beginner
- 題幹：以下哪段 HTML 以明確關聯方式，將標籤連到 Email 欄位？
- 選項：
  1. `<label>Email</label><input id="email" type="email">`
  2. `<label for="email">Email</label><input id="email" type="email">`
  3. `<label name="email">Email</label><input type="email">`
  4. `<input label="Email" type="email">`
- 正解：2
- 選項解析：1 沒有巢狀或 `for` 關聯；2 正確，`for` 對應欄位 `id`；3 `label` 不以 `name` 建立關聯；4 `input` 沒有用來取代 `label` 的 `label` 屬性。
- 整題解析：明確標籤的 `for` 值要等於表單控制項的 `id`。來源：[MDN：Forms and buttons in HTML](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/HTML_forms)。

### D-02｜辨認表單控制項

- `skillId`: `html-forms`；情境：概念辨認；方式：多選；難度：beginner
- 題幹：下列哪些元素可作為使用者操作的表單控制項？（選出所有正確答案）
- 選項：`<input>`、`<select>`、`<button>`、`<main>`
- 正解：`<input>`、`<select>`、`<button>`
- 選項解析：前三者可建立表單輸入、選擇或操作控制項；`<main>` 標記頁面的主要內容，不是表單控制項。
- 整題解析：題目需要區分「表單內的結構容器」和「表單控制項」。來源：[WHATWG HTML Standard：Forms](https://html.spec.whatwg.org/multipage/forms.html)。

### D-03｜CSS 盒模型計算

- `skillId`: `css-basics`；情境：程式結果推演；方式：單選；難度：intermediate
- 題幹：在預設 `content-box` 盒模型下，`.card` 的外框寬度是多少？
- 程式碼：

  ```css
  .card {
    box-sizing: content-box;
    width: 200px;
    padding-inline: 16px;
    border: 2px solid;
  }
  ```

- 選項：200px、232px、236px、240px
- 正解：236px
- 選項解析：200px 只算內容寬；232px 漏算左右邊框；236px 正確，為 200 + 16×2 + 2×2；240px 將邊框或 padding 重複計算。
- 整題解析：`content-box` 的 `width` 表示內容寬，水平 padding 和 border 會加到外框尺寸；margin 不屬於 border box。來源：[MDN：The box model](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model)。

### D-04｜響應式斷點判斷

- `skillId`: `rwd`；情境：版面需求判斷；方式：單選；難度：beginner
- 題幹：需求是「瀏覽器視窗寬度為 640px 或更窄時套用手機版樣式」。哪個媒體查詢符合需求？
- 選項：`@media (max-width: 640px)`、`@media (min-width: 640px)`、`@media (max-height: 640px)`、`@media (width: 640px)`
- 正解：`@media (max-width: 640px)`
- 選項解析：`max-width` 包含 640px 及更窄的視窗；`min-width` 選取較寬視窗；`max-height` 檢查高度；`width: 640px` 只匹配該寬度值。
- 整題解析：媒體查詢可以依 viewport 寬度套用條件式 CSS。來源：[MDN：Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using)。

### D-05｜JavaScript nullish 預設值

- `skillId`: `js-basics`；情境：程式結果推演；方式：單選；難度：beginner
- 題幹：執行下列程式時，主控台會輸出什麼？
- 程式碼：

  ```js
  const savedCount = 0;
  console.log(savedCount ?? 5);
  ```

- 選項：`5`、`0`、`null`、`undefined`
- 正解：`0`
- 選項解析：`??` 只在左側為 `null` 或 `undefined` 時使用右側值；`0` 是有效數字，因此保留。
- 整題解析：若改用 `||`，`0` 會被視為 falsy 並落到右側。來源：[MDN：Nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)。

### D-06｜除錯：保留 0 作為有效值

- `skillId`: `js-basics`；情境：除錯；方式：多選；難度：intermediate
- 題幹：`value` 可能是數字 `0`、空字串、`null` 或 `undefined`。若需求是只在 `null` 或 `undefined` 時顯示預設字串，哪些寫法符合需求？
- 選項：`value ?? "未設定"`、`value || "未設定"`、`value === null || value === undefined ? "未設定" : value`、`value === 0 ? "未設定" : value`
- 正解：第 1、3 項
- 選項解析：第 1 項使用 nullish coalescing；第 2 項也會替換 `0` 和空字串；第 3 項只替換兩種 nullish 值；第 4 項把有效的 `0` 當成未設定。
- 整題解析：預設值的條件要符合需求的缺值定義，不能把所有 falsy 值都當成沒有資料。來源：[MDN：Nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)。

### D-07｜建立並切換 Git 分支

- `skillId`: `git-branches`；情境：工作流程判斷；方式：單選；難度：beginner
- 題幹：假設 `feature/login` 尚不存在於本機或遠端，要建立這個分支並立即切換過去，應使用哪個命令？
- 選項：`git switch -c feature/login`、`git branch feature/login`、`git switch feature/login`、`git merge feature/login`
- 正解：`git switch -c feature/login`
- 選項解析：`switch -c` 建立並切換；`branch` 只建立分支；沒有 `-c` 的 `switch` 是切換到既有分支；`merge` 是合併分支。
- 整題解析：建立新分支並切換可用 `git switch -c <new-branch>`。來源：[Git：git-switch](https://git-scm.com/docs/git-switch)。

### D-08｜HTTP 認證與授權情境

- `skillId`: `http-basics`；情境：API 情境判斷；方式：單選；難度：beginner
- 題幹：使用者請求受保護的 API，但請求沒有有效的認證憑證。最合適的狀態碼是哪一個？
- 選項：`200`、`401`、`403`、`404`
- 正解：`401`
- 選項解析：`200` 表示成功；`401` 表示缺少或沒有有效認證憑證；`403` 通常表示已完成認證但沒有權限；`404` 表示找不到資源。
- 整題解析：題幹限定「未提供有效認證」以區分 401 與已認證但無權限的 403。來源：[MDN：401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401)、[MDN：403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403)。

## 4. 資料格式映射與展示限制

每題可映射到現有欄位：

| 題目欄位 | 用途 |
|---|---|
| `skillId` | 對應一個技能節點 |
| `prompt` | 題幹與必要程式碼；展示版以純文字／Markdown 顯示，不執行程式碼 |
| `answerMode` | `single` 單選或 `multiple` 多選 |
| `choices` | 選項文字；展示題控制在 4 個選項，且不超過 10 個 |
| `correctChoices` | 從 0 起算的正解索引 |
| `choiceExplanations` | 依選項相同順序提供正誤理由 |
| `explanation` | 整題概念摘要與延伸閱讀來源連結 |
| `difficulty` / `status` | 難度和審核發布狀態 |

「情境」標籤目前沒有資料庫欄位；展示時可放在題目副標或文件索引。若日後需要搜尋、篩選或成效分析，再新增經確認的 tag 欄位。`is_demo=true` 的題目只供展示，正式測驗取題不得包含它們；答案只可在管理端或作答完成後的受控結果流程使用。

## 5. 題庫來源策略

### 5.1 來源優先順序

1. **標準或官方產品文件**：核對語言和平台行為，例如 WHATWG HTML、CSSWG、ECMAScript、React、Node.js、Git、npm、HTTP RFC 和測試工具官方文件。
2. **教學型官方文件**：用 MDN 等教學頁面確認初學者理解路徑、常見錯誤和例子；題目文字自行撰寫，保留來源連結和版本檢查日期。
3. **開放授權教材／題庫**：只有在來源頁明確標示授權、允許改作及再散布，且符合專案用途時才採用；逐題保留歸屬、授權版本和修改說明。
4. **社群或商業教材**：作為發現學習盲點的線索，不複製其原題、選項或解析；需要直接使用時先取得明確授權。

MDN 的授權說明指出，文件文字採 CC BY-SA 2.5 或更新版本，並要求標示標題、連結和修改情形；程式碼範例的授權依年代而異，遷移後的部分範例不易判定原授權。實作上優先自行編寫題目和短程式碼，只用來源頁核對事實；若要改作 MDN 文字，先記錄授權和完整歸屬。參考：[MDN：Attribution and copyright licensing](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license)。

### 5.2 依技能分類建立來源地圖

| 技能範圍 | 第一優先核對來源 | 備註 |
|---|---|---|
| HTML、表單 | [WHATWG HTML Standard](https://html.spec.whatwg.org/)、[MDN HTML learning](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content) | 規範以 WHATWG 為準；題目用 MDN 建立初學者情境。 |
| CSS、RWD | [W3C CSS](https://www.w3.org/Style/CSS/)、[MDN CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics) | 對照瀏覽器相容性時記錄頁面檢查日期。 |
| JavaScript、非同步 | [ECMAScript specification](https://tc39.es/ecma262/)、[MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) | 規格細節用 ECMA-262 核對，教學措辭參考 MDN。 |
| React | [React Learn](https://react.dev/learn) | 以目前 React 官方教學中的元件、props、state 概念設題。 |
| Node、npm、終端機 | [Node.js Learn](https://nodejs.org/en/learn)、[npm Docs](https://docs.npmjs.com/) | 終端機題須標明 shell 或作業系統，避免答案依環境而異。 |
| Git | [Git Documentation](https://git-scm.com/docs) | 以命令文件核對旗標和副作用。 |
| HTTP、API、測試 | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)、[MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)、[Vitest Guide](https://vitest.dev/guide/)、[Testing Library](https://testing-library.com/docs/) | 規範與工具文件分開記錄；不要把特定函式庫慣例寫成通用網頁規則。 |

### 5.3 每題來源紀錄

正式題目來源清冊至少記錄：

| 欄位 | 說明 |
|---|---|
| 題目識別碼／版本 | 不依賴資料庫流水號，編輯後保留可追溯版本 |
| `skillId`／學習目標 | 對應技能節點和一個可檢查的知識點 |
| 來源標題與 URL | 指向直接支持答案的頁面，不只記入口首頁 |
| 來源版本／查核日期 | 標準版號或頁面版本；活文件記最後核對日 |
| 授權與使用方式 | 原創、改寫、直接引用；若引用，記授權及必要歸屬 |
| 作者／技術審核／語文審核 | 作者與第二位審核者分開記錄 |
| 難度、作答方式、狀態 | draft → reviewed → published；改動後重新審查 |
| 最後複核日期／觸發條件 | 規格、產品版本或來源頁有變更時回查 |

現行 schema 不含這些來源欄位。第一輪可用版本控制中的 sidecar CSV/JSON 管理；正式後台需要編輯者維護來源時，再評估新增 `question_sources` 關聯資料表或等效欄位。不要把來源資訊塞進 `explanation` 來代替可查詢的 provenance。

## 6. 正式題庫擴充流程

1. B 確認正式 15 個節點、每個節點的 learning items 和節點是否仍 active。
2. B/C/E 對齊「5 題最低門檻」與 C PR #86 原本「8 道可用題」的差異，以及正式測驗抽題數、通過分數和答案模式。目前共用 API 契約和本分支建立測驗 route 使用 5 題門檻；此差異仍需 C review。若團隊決定改成 8，需同步更新契約、route、API Explorer 和測試。
3. 為每個 learning item 建來源地圖；標記官方規格、教學參考和授權狀態。
4. 先為每個技能寫 8 題規劃目標（建議分布：3 beginner、3 intermediate、2 advanced）；這是內容規劃目標，現行 API 建立測驗的最低題庫門檻仍為 5 題。
5. 依學習目標寫原創題幹和干擾選項；每個選項都有清楚理由，程式題需手動推演並由第二人獨立核答。
6. 審查技術正確、繁體中文清楚、無歧義、難度相符、來源可追溯與授權可用後，再標示 published。
7. 發布後定期複核；來源頁更新、標準版本變更、使用者錯誤率異常或題目爭議都會觸發重審。

若保留目前 15 個技能節點，5 題最低門檻是 75 道正式題；每節點 8 題的規劃目標是 120 道。這兩個數字都不包含展示 seed。

## 7. 建議採用的審題清單

- 題目只考一個主要學習目標，且可對應到一個技能節點。
- 正確答案由所列來源直接支持；版本或瀏覽器條件已在題幹交代。
- 單選只有一個最佳答案；多選明示「選出所有正確答案」，不使用部分給分假設。
- 每個錯誤選項代表可辨認的常見誤解，解析不只寫「錯誤」。
- 程式碼可讀、最小且可手動推演；不執行展示題中的使用者輸入程式碼。
- 不用猜測意圖、冷僻細節或未教內容當難度；避免以措辭陷阱代替理解。
- 對外展示前確認 `is_demo`、`status` 和測驗 API 的篩選行為，避免展示題進入正式抽題或正解提早暴露。

## 8. 待確認事項

| 項目 | 暫定建議 | 決策者 |
|---|---|---|
| 正式每節點題量 | 規劃 8 題；API 契約和目前 route 最低 5 題；C PR #86 原本要求 8 道可用題，需 C review 是否要調高正式門檻 | B/C/E |
| 每次測驗題數與通過標準 | C 交接稿提案為抽 5 題、答對至少 4 題 | C，與 B/E 對齊 |
| 多選題是否納入正式測驗 | schema 可存單選、多選；測驗計分規則未在目前契約定義 | C |
| 題目來源 metadata 儲存位置 | 第一輪 sidecar 清冊；後台需要編輯時再加 schema | E/C |
| 除單選、多選外的互動題型 | 先不納入展示資料契約；另提功能需求 | C/E |
