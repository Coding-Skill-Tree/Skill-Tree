// V2.1 課程資料：5 技能、26 單元、132 節點。
export const skills = [
  {
    "id": "html",
    "name": "HTML",
    "description": "網頁結構與基礎",
    "goal": "能夠獨立撰寫具有正確結構、語意及表單功能的網頁。",
    "intro": "認識 HTML、CSS、JavaScript 的差異，以及瀏覽器的基本角色。",
    "introObjectives": [
      "認識 HTML 的基本用途。",
      "區分 HTML、CSS、JavaScript 的角色。",
      "了解瀏覽器的基本功能。"
    ],
    "units": [
      {
        "id": "01",
        "title": "認識 HTML",
        "nodes": [
          {
            "id": "H01",
            "title": "認識網頁與 HTML",
            "prerequisite": null,
            "type": "lesson",
            "topic": "HTML、CSS、JS 的差異、瀏覽器"
          },
          {
            "id": "H02",
            "title": "HTML 文件結構",
            "prerequisite": "H01",
            "type": "lesson",
            "topic": "DOCTYPE、html、head、body、title"
          },
          {
            "id": "H03",
            "title": "元素與屬性",
            "prerequisite": "H02",
            "type": "lesson",
            "topic": "Tag、Element、Attribute、巢狀結構、註解"
          },
          {
            "id": "H04",
            "title": "標題與文字段落",
            "prerequisite": "H03",
            "type": "lesson",
            "topic": "h1～h6、p、br、strong、em"
          },
          {
            "id": "H05",
            "title": "基礎挑戰",
            "prerequisite": "H04",
            "type": "unit-challenge",
            "topic": "文件結構、標籤配對、錯誤修正"
          }
        ]
      },
      {
        "id": "02",
        "title": "豐富網頁內容",
        "nodes": [
          {
            "id": "H06",
            "title": "清單與項目",
            "prerequisite": "H05",
            "type": "lesson",
            "topic": "ul、ol、li、巢狀清單"
          },
          {
            "id": "H07",
            "title": "超連結",
            "prerequisite": "H06",
            "type": "lesson",
            "topic": "a、href、target、錨點連結"
          },
          {
            "id": "H08",
            "title": "檔案與資源路徑",
            "prerequisite": "H07",
            "type": "lesson",
            "topic": "相對路徑、絕對路徑、資料夾結構"
          },
          {
            "id": "H09",
            "title": "圖片與媒體",
            "prerequisite": "H08",
            "type": "lesson",
            "topic": "img、src、alt、audio、video"
          },
          {
            "id": "H10",
            "title": "內容挑戰",
            "prerequisite": "H09",
            "type": "unit-challenge",
            "topic": "建立圖文並茂的文章頁面"
          }
        ]
      },
      {
        "id": "03",
        "title": "網頁結構與語意",
        "nodes": [
          {
            "id": "H11",
            "title": "區塊與行內容器",
            "prerequisite": "H10",
            "type": "lesson",
            "topic": "div、span、一般容器的使用"
          },
          {
            "id": "H12",
            "title": "語意化標籤",
            "prerequisite": "H11",
            "type": "lesson",
            "topic": "header、nav、main、footer、article、section"
          },
          {
            "id": "H13",
            "title": "表格結構",
            "prerequisite": "H12",
            "type": "lesson",
            "topic": "table、thead、tbody、tr、th、td"
          },
          {
            "id": "H14",
            "title": "網頁無障礙基礎",
            "prerequisite": "H13",
            "type": "lesson",
            "topic": "標題層級、語意標籤、alt、caption、scope"
          },
          {
            "id": "H15",
            "title": "結構挑戰",
            "prerequisite": "H14",
            "type": "unit-challenge",
            "topic": "建立具有正確語意的網頁"
          }
        ]
      },
      {
        "id": "04",
        "title": "表單與綜合應用",
        "nodes": [
          {
            "id": "H16",
            "title": "認識表單",
            "prerequisite": "H15",
            "type": "lesson",
            "topic": "form、action、method、name"
          },
          {
            "id": "H17",
            "title": "輸入欄位",
            "prerequisite": "H16",
            "type": "lesson",
            "topic": "input、text、email、password、number"
          },
          {
            "id": "H18",
            "title": "表單控制元件",
            "prerequisite": "H17",
            "type": "lesson",
            "topic": "label、radio、checkbox、select、textarea、button"
          },
          {
            "id": "H19",
            "title": "表單驗證",
            "prerequisite": "H18",
            "type": "lesson",
            "topic": "required、minlength、maxlength、pattern"
          },
          {
            "id": "H20",
            "title": "HTML 最終挑戰",
            "prerequisite": "H19",
            "type": "final-challenge",
            "topic": "建立完整個人介紹與聯絡表單頁面"
          }
        ]
      }
    ]
  },
  {
    "id": "css",
    "name": "CSS",
    "description": "樣式設計與排版",
    "goal": "能夠將 HTML 結構轉換為美觀、易用且符合響應式需求的網頁。",
    "intro": "認識 CSS 樣式規則、屬性和值，以及 CSS 的引入方式。",
    "introObjectives": [
      "了解 CSS 的用途。",
      "區分屬性與屬性值。",
      "認識 CSS 的引入方式。"
    ],
    "units": [
      {
        "id": "01",
        "title": "CSS 基礎語法",
        "nodes": [
          {
            "id": "C01",
            "title": "認識 CSS",
            "prerequisite": null,
            "type": "lesson",
            "topic": "Property、Value、Declaration、CSS 引入方式"
          },
          {
            "id": "C02",
            "title": "基礎選擇器",
            "prerequisite": "C01",
            "type": "lesson",
            "topic": "元素選擇器、class、id、通用選擇器"
          },
          {
            "id": "C03",
            "title": "組合與進階選擇器",
            "prerequisite": "C02",
            "type": "lesson",
            "topic": "後代、子元素、相鄰選擇器、偽類、偽元素"
          },
          {
            "id": "C04",
            "title": "樣式優先權",
            "prerequisite": "C03",
            "type": "lesson",
            "topic": "Cascade、Specificity、Inheritance"
          },
          {
            "id": "C05",
            "title": "語法挑戰",
            "prerequisite": "C04",
            "type": "unit-challenge",
            "topic": "選擇器與樣式優先權判斷"
          }
        ]
      },
      {
        "id": "02",
        "title": "視覺樣式設計",
        "nodes": [
          {
            "id": "C06",
            "title": "色彩與背景",
            "prerequisite": "C05",
            "type": "lesson",
            "topic": "color、background、HEX、RGB、opacity"
          },
          {
            "id": "C07",
            "title": "文字與字型",
            "prerequisite": "C06",
            "type": "lesson",
            "topic": "font-size、font-family、font-weight、line-height、text-align"
          },
          {
            "id": "C08",
            "title": "CSS 尺寸單位",
            "prerequisite": "C07",
            "type": "lesson",
            "topic": "px、%、em、rem、vw、vh"
          },
          {
            "id": "C09",
            "title": "邊框與視覺效果",
            "prerequisite": "C08",
            "type": "lesson",
            "topic": "border、border-radius、box-shadow"
          },
          {
            "id": "C10",
            "title": "樣式挑戰",
            "prerequisite": "C09",
            "type": "unit-challenge",
            "topic": "製作個人資訊卡片"
          }
        ]
      },
      {
        "id": "03",
        "title": "盒模型與定位",
        "nodes": [
          {
            "id": "C11",
            "title": "盒模型 Box Model",
            "prerequisite": "C10",
            "type": "lesson",
            "topic": "margin、padding、border、content、box-sizing"
          },
          {
            "id": "C12",
            "title": "元素顯示方式",
            "prerequisite": "C11",
            "type": "lesson",
            "topic": "display、block、inline、inline-block、none"
          },
          {
            "id": "C13",
            "title": "尺寸與溢出",
            "prerequisite": "C12",
            "type": "lesson",
            "topic": "width、height、max-width、overflow"
          },
          {
            "id": "C14",
            "title": "元素定位與層級",
            "prerequisite": "C13",
            "type": "lesson",
            "topic": "position、relative、absolute、fixed、sticky、z-index"
          },
          {
            "id": "C15",
            "title": "定位挑戰",
            "prerequisite": "C14",
            "type": "unit-challenge",
            "topic": "製作帶有角標及固定導覽列的介面"
          }
        ]
      },
      {
        "id": "04",
        "title": "Flexbox 排版",
        "nodes": [
          {
            "id": "C16",
            "title": "認識 Flexbox",
            "prerequisite": "C15",
            "type": "lesson",
            "topic": "display: flex、主軸、交叉軸"
          },
          {
            "id": "C17",
            "title": "排列方向與換行",
            "prerequisite": "C16",
            "type": "lesson",
            "topic": "flex-direction、flex-wrap"
          },
          {
            "id": "C18",
            "title": "元素對齊方式",
            "prerequisite": "C17",
            "type": "lesson",
            "topic": "justify-content、align-items、align-self、gap"
          },
          {
            "id": "C19",
            "title": "Flex 元素尺寸",
            "prerequisite": "C18",
            "type": "lesson",
            "topic": "flex-grow、flex-shrink、flex-basis"
          },
          {
            "id": "C20",
            "title": "Flexbox 挑戰",
            "prerequisite": "C19",
            "type": "unit-challenge",
            "topic": "導覽列、卡片排列、水平垂直置中"
          }
        ]
      },
      {
        "id": "05",
        "title": "CSS Grid 排版",
        "nodes": [
          {
            "id": "C21",
            "title": "認識 Grid",
            "prerequisite": "C20",
            "type": "lesson",
            "topic": "display: grid、grid-template-columns、rows、fr"
          },
          {
            "id": "C22",
            "title": "網格定位",
            "prerequisite": "C21",
            "type": "lesson",
            "topic": "grid-column、grid-row、grid-area"
          },
          {
            "id": "C23",
            "title": "彈性網格配置",
            "prerequisite": "C22",
            "type": "lesson",
            "topic": "repeat、minmax、auto-fit、auto-fill"
          },
          {
            "id": "C24",
            "title": "Grid 挑戰",
            "prerequisite": "C23",
            "type": "unit-challenge",
            "topic": "製作商品列表或儀表板版面"
          }
        ]
      },
      {
        "id": "06",
        "title": "響應式與互動設計",
        "nodes": [
          {
            "id": "C25",
            "title": "響應式網頁設計",
            "prerequisite": "C24",
            "type": "lesson",
            "topic": "Media Query、Breakpoint、Mobile First"
          },
          {
            "id": "C26",
            "title": "彈性版面與圖片",
            "prerequisite": "C25",
            "type": "lesson",
            "topic": "流動式排版、max-width、clamp、object-fit"
          },
          {
            "id": "C27",
            "title": "互動樣式與轉場",
            "prerequisite": "C26",
            "type": "lesson",
            "topic": "hover、focus-visible、transform、transition、減少動態效果"
          },
          {
            "id": "C28",
            "title": "CSS 最終挑戰",
            "prerequisite": "C27",
            "type": "final-challenge",
            "topic": "製作完整 RWD 響應式網站"
          }
        ]
      }
    ]
  },
  {
    "id": "javascript",
    "name": "JavaScript",
    "description": "互動功能與程式邏輯",
    "goal": "建立程式思維，具備資料處理、網頁互動及 API 串接能力。",
    "intro": "了解 JavaScript 在網頁中的角色、script 標籤與基本執行方式。",
    "introObjectives": [
      "認識 JavaScript 的用途。",
      "了解 script 的基本使用。",
      "使用 console.log 查看輸出。"
    ],
    "units": [
      {
        "id": "01",
        "title": "JavaScript 基礎語法",
        "nodes": [
          {
            "id": "J01",
            "title": "認識 JavaScript",
            "prerequisite": null,
            "type": "lesson",
            "topic": "script、console.log、JS 執行方式"
          },
          {
            "id": "J02",
            "title": "變數與常數",
            "prerequisite": "J01",
            "type": "lesson",
            "topic": "let、const、var、變數命名"
          },
          {
            "id": "J03",
            "title": "資料型別",
            "prerequisite": "J02",
            "type": "lesson",
            "topic": "String、Number、Boolean、null、undefined、typeof"
          },
          {
            "id": "J04",
            "title": "運算與型別轉換",
            "prerequisite": "J03",
            "type": "lesson",
            "topic": "算術運算子、賦值運算子、Number、String"
          },
          {
            "id": "J05",
            "title": "字串處理",
            "prerequisite": "J04",
            "type": "lesson",
            "topic": "Template Literal、字串串接、length、includes"
          },
          {
            "id": "J06",
            "title": "基礎語法挑戰",
            "prerequisite": "J05",
            "type": "unit-challenge",
            "topic": "變數、資料型別、程式執行結果"
          }
        ]
      },
      {
        "id": "02",
        "title": "條件判斷與迴圈",
        "nodes": [
          {
            "id": "J07",
            "title": "比較與邏輯運算",
            "prerequisite": "J06",
            "type": "lesson",
            "topic": "===、==、!=、>、&&、邏輯或、!、Truthy、Falsy"
          },
          {
            "id": "J08",
            "title": "條件判斷",
            "prerequisite": "J07",
            "type": "lesson",
            "topic": "if、else、else if"
          },
          {
            "id": "J09",
            "title": "多條件判斷",
            "prerequisite": "J08",
            "type": "lesson",
            "topic": "switch、case、三元運算子"
          },
          {
            "id": "J10",
            "title": "For 迴圈",
            "prerequisite": "J09",
            "type": "lesson",
            "topic": "for、計數器、執行次數"
          },
          {
            "id": "J11",
            "title": "While 與迴圈控制",
            "prerequisite": "J10",
            "type": "lesson",
            "topic": "while、break、continue、巢狀迴圈"
          },
          {
            "id": "J12",
            "title": "程式邏輯挑戰",
            "prerequisite": "J11",
            "type": "unit-challenge",
            "topic": "成績判斷、九九乘法、數字加總"
          }
        ]
      },
      {
        "id": "03",
        "title": "函式與程式組織",
        "nodes": [
          {
            "id": "J13",
            "title": "函式基礎",
            "prerequisite": "J12",
            "type": "lesson",
            "topic": "function、函式宣告、函式呼叫"
          },
          {
            "id": "J14",
            "title": "參數與回傳值",
            "prerequisite": "J13",
            "type": "lesson",
            "topic": "Parameter、Argument、return"
          },
          {
            "id": "J15",
            "title": "變數作用域",
            "prerequisite": "J14",
            "type": "lesson",
            "topic": "Scope、Global、Local、Block Scope"
          },
          {
            "id": "J16",
            "title": "箭頭函式",
            "prerequisite": "J15",
            "type": "lesson",
            "topic": "Arrow Function、簡寫、隱式回傳"
          },
          {
            "id": "J17",
            "title": "程式除錯基礎",
            "prerequisite": "J16",
            "type": "lesson",
            "topic": "SyntaxError、ReferenceError、TypeError、DevTools"
          },
          {
            "id": "J18",
            "title": "函式挑戰",
            "prerequisite": "J17",
            "type": "unit-challenge",
            "topic": "將重複的程式邏輯封裝成函式"
          }
        ]
      },
      {
        "id": "04",
        "title": "陣列、物件與資料處理",
        "nodes": [
          {
            "id": "J19",
            "title": "陣列基礎",
            "prerequisite": "J18",
            "type": "lesson",
            "topic": "Array、Index、length、push、pop、slice、splice"
          },
          {
            "id": "J20",
            "title": "陣列走訪",
            "prerequisite": "J19",
            "type": "lesson",
            "topic": "for...of、forEach、Callback Function"
          },
          {
            "id": "J21",
            "title": "物件基礎",
            "prerequisite": "J20",
            "type": "lesson",
            "topic": "Object、Key、Value、屬性存取"
          },
          {
            "id": "J22",
            "title": "陣列資料處理",
            "prerequisite": "J21",
            "type": "lesson",
            "topic": "map、filter、find、some"
          },
          {
            "id": "J23",
            "title": "ES6 資料操作",
            "prerequisite": "J22",
            "type": "lesson",
            "topic": "Destructuring、Spread、Rest"
          },
          {
            "id": "J24",
            "title": "資料處理挑戰",
            "prerequisite": "J23",
            "type": "unit-challenge",
            "topic": "商品篩選、學生成績、資料清單"
          }
        ]
      },
      {
        "id": "05",
        "title": "DOM 與網頁互動",
        "nodes": [
          {
            "id": "J25",
            "title": "認識 DOM",
            "prerequisite": "J24",
            "type": "lesson",
            "topic": "Document、querySelector、querySelectorAll"
          },
          {
            "id": "J26",
            "title": "修改網頁內容",
            "prerequisite": "J25",
            "type": "lesson",
            "topic": "textContent、value、style、classList"
          },
          {
            "id": "J27",
            "title": "動態操作元素",
            "prerequisite": "J26",
            "type": "lesson",
            "topic": "createElement、append、remove"
          },
          {
            "id": "J28",
            "title": "事件處理",
            "prerequisite": "J27",
            "type": "lesson",
            "topic": "addEventListener、click、input、change、Event"
          },
          {
            "id": "J29",
            "title": "表單與事件控制",
            "prerequisite": "J28",
            "type": "lesson",
            "topic": "submit、preventDefault、event.target、輸入驗證"
          },
          {
            "id": "J30",
            "title": "網頁互動挑戰",
            "prerequisite": "J29",
            "type": "unit-challenge",
            "topic": "計數器、待辦清單、動態新增與刪除"
          }
        ]
      },
      {
        "id": "06",
        "title": "非同步與資料串接",
        "nodes": [
          {
            "id": "J31",
            "title": "JavaScript 模組",
            "prerequisite": "J30",
            "type": "lesson",
            "topic": "import、export、模組化概念"
          },
          {
            "id": "J32",
            "title": "JSON 與本地儲存",
            "prerequisite": "J31",
            "type": "lesson",
            "topic": "JSON.parse、JSON.stringify、LocalStorage"
          },
          {
            "id": "J33",
            "title": "非同步程式概念",
            "prerequisite": "J32",
            "type": "lesson",
            "topic": "同步與非同步、Promise、async、await"
          },
          {
            "id": "J34",
            "title": "API 資料串接",
            "prerequisite": "J33",
            "type": "lesson",
            "topic": "fetch、HTTP Request、Response、response.ok"
          },
          {
            "id": "J35",
            "title": "錯誤處理",
            "prerequisite": "J34",
            "type": "lesson",
            "topic": "try、catch、finally、載入與錯誤狀態"
          },
          {
            "id": "J36",
            "title": "JavaScript 最終挑戰",
            "prerequisite": "J35",
            "type": "final-challenge",
            "topic": "製作具有 API 搜尋與收藏功能的網站"
          }
        ]
      }
    ]
  },
  {
    "id": "react",
    "name": "React",
    "description": "元件化前端開發",
    "goal": "具備獨立開發 React 小型應用程式的能力。",
    "intro": "認識 React、SPA、npm、Vite 與基本專案結構。",
    "introObjectives": [
      "了解 React 與 SPA 的概念。",
      "認識 npm 與 Vite 的用途。",
      "辨識基本專案結構。"
    ],
    "units": [
      {
        "id": "01",
        "title": "React 與元件基礎",
        "nodes": [
          {
            "id": "R01",
            "title": "認識 React",
            "prerequisite": null,
            "type": "lesson",
            "topic": "React、SPA、npm、Vite、專案結構"
          },
          {
            "id": "R02",
            "title": "JSX 語法",
            "prerequisite": "R01",
            "type": "lesson",
            "topic": "JSX、JavaScript 表達式、Fragment、className"
          },
          {
            "id": "R03",
            "title": "元件 Component",
            "prerequisite": "R02",
            "type": "lesson",
            "topic": "Function Component、元件命名與組合"
          },
          {
            "id": "R04",
            "title": "Props 資料傳遞",
            "prerequisite": "R03",
            "type": "lesson",
            "topic": "Props、children、父子元件"
          },
          {
            "id": "R05",
            "title": "元件挑戰",
            "prerequisite": "R04",
            "type": "unit-challenge",
            "topic": "建立可重複使用的商品卡片元件"
          }
        ]
      },
      {
        "id": "02",
        "title": "動態渲染與狀態",
        "nodes": [
          {
            "id": "R06",
            "title": "條件渲染",
            "prerequisite": "R05",
            "type": "lesson",
            "topic": "Conditional Rendering、三元運算子、條件顯示"
          },
          {
            "id": "R07",
            "title": "列表渲染",
            "prerequisite": "R06",
            "type": "lesson",
            "topic": "map、key、動態列表"
          },
          {
            "id": "R08",
            "title": "React 事件處理",
            "prerequisite": "R07",
            "type": "lesson",
            "topic": "onClick、onChange、Event Handler"
          },
          {
            "id": "R09",
            "title": "useState 狀態管理",
            "prerequisite": "R08",
            "type": "lesson",
            "topic": "State、Setter、Re-render"
          },
          {
            "id": "R10",
            "title": "互動挑戰",
            "prerequisite": "R09",
            "type": "unit-challenge",
            "topic": "計數器、收藏按鈕、顯示切換"
          }
        ]
      },
      {
        "id": "03",
        "title": "表單與元件資料管理",
        "nodes": [
          {
            "id": "R11",
            "title": "狀態更新機制",
            "prerequisite": "R10",
            "type": "lesson",
            "topic": "State Snapshot、Previous State、函式型更新"
          },
          {
            "id": "R12",
            "title": "陣列與物件狀態",
            "prerequisite": "R11",
            "type": "lesson",
            "topic": "Immutable Update、Spread、更新與刪除資料"
          },
          {
            "id": "R13",
            "title": "React 表單",
            "prerequisite": "R12",
            "type": "lesson",
            "topic": "Controlled Component、value、onChange、onSubmit"
          },
          {
            "id": "R14",
            "title": "元件間的狀態共享",
            "prerequisite": "R13",
            "type": "lesson",
            "topic": "Lifting State Up、Props Callback、Derived State"
          },
          {
            "id": "R15",
            "title": "資料管理挑戰",
            "prerequisite": "R14",
            "type": "unit-challenge",
            "topic": "React 待辦清單、搜尋與篩選"
          }
        ]
      },
      {
        "id": "04",
        "title": "副作用與 API",
        "nodes": [
          {
            "id": "R16",
            "title": "認識 useEffect",
            "prerequisite": "R15",
            "type": "lesson",
            "topic": "Effect、外部系統同步、事件與 Effect 的差異"
          },
          {
            "id": "R17",
            "title": "依賴與清除機制",
            "prerequisite": "R16",
            "type": "lesson",
            "topic": "Dependency Array、Cleanup、Effect 執行時機"
          },
          {
            "id": "R18",
            "title": "React API 串接",
            "prerequisite": "R17",
            "type": "lesson",
            "topic": "fetch、async/await、資料取得"
          },
          {
            "id": "R19",
            "title": "非同步資料狀態",
            "prerequisite": "R18",
            "type": "lesson",
            "topic": "Loading、Error、Empty State、過期請求處理"
          },
          {
            "id": "R20",
            "title": "API 挑戰",
            "prerequisite": "R19",
            "type": "unit-challenge",
            "topic": "建立外部資料搜尋與顯示功能"
          }
        ]
      },
      {
        "id": "05",
        "title": "頁面路由與共用狀態",
        "nodes": [
          {
            "id": "R21",
            "title": "React Router 基礎",
            "prerequisite": "R20",
            "type": "lesson",
            "topic": "BrowserRouter、Routes、Route"
          },
          {
            "id": "R22",
            "title": "導覽與動態路由",
            "prerequisite": "R21",
            "type": "lesson",
            "topic": "Link、useNavigate、useParams"
          },
          {
            "id": "R23",
            "title": "Context 共用狀態",
            "prerequisite": "R22",
            "type": "lesson",
            "topic": "createContext、Provider、useContext"
          },
          {
            "id": "R24",
            "title": "多頁面挑戰",
            "prerequisite": "R23",
            "type": "unit-challenge",
            "topic": "商品列表、商品詳情、收藏頁面"
          }
        ]
      },
      {
        "id": "06",
        "title": "React 專案整合",
        "nodes": [
          {
            "id": "R25",
            "title": "useRef 應用",
            "prerequisite": "R24",
            "type": "lesson",
            "topic": "Ref、DOM 參照、focus、跨渲染保存資料"
          },
          {
            "id": "R26",
            "title": "自訂 Hooks",
            "prerequisite": "R25",
            "type": "lesson",
            "topic": "Custom Hook、重複邏輯抽離、Hooks 使用規則"
          },
          {
            "id": "R27",
            "title": "專案整理與除錯",
            "prerequisite": "R26",
            "type": "lesson",
            "topic": "React DevTools、元件拆分、資料夾結構、Build"
          },
          {
            "id": "R28",
            "title": "React 最終挑戰",
            "prerequisite": "R27",
            "type": "final-challenge",
            "topic": "製作完整商品搜尋與收藏系統"
          }
        ]
      }
    ]
  },
  {
    "id": "git",
    "name": "Git",
    "description": "版本控制與團隊協作",
    "goal": "具備獨立管理專案版本、處理分支及參與團隊開發的能力。",
    "intro": "認識版本控制、儲存庫以及 Git 與 GitHub 的差異。",
    "introObjectives": [
      "了解版本控制的用途。",
      "認識 Repository。",
      "區分 Git 與 GitHub。"
    ],
    "units": [
      {
        "id": "01",
        "title": "版本控制基礎",
        "nodes": [
          {
            "id": "G01",
            "title": "認識 Git",
            "prerequisite": null,
            "type": "lesson",
            "topic": "版本控制、Repository、Git 與 GitHub 的差異"
          },
          {
            "id": "G02",
            "title": "Git 環境與初始化",
            "prerequisite": "G01",
            "type": "lesson",
            "topic": "git config、git init"
          },
          {
            "id": "G03",
            "title": "檔案追蹤與暫存",
            "prerequisite": "G02",
            "type": "lesson",
            "topic": "git status、git add、Staging Area"
          },
          {
            "id": "G04",
            "title": "提交與版本紀錄",
            "prerequisite": "G03",
            "type": "lesson",
            "topic": "git commit、git log、Commit Message"
          },
          {
            "id": "G05",
            "title": "版本控制挑戰",
            "prerequisite": "G04",
            "type": "unit-challenge",
            "topic": "建立儲存庫並完成第一次版本提交"
          }
        ]
      },
      {
        "id": "02",
        "title": "版本管理與錯誤修正",
        "nodes": [
          {
            "id": "G06",
            "title": "比對檔案差異",
            "prerequisite": "G05",
            "type": "lesson",
            "topic": "git diff、git diff --staged、git show"
          },
          {
            "id": "G07",
            "title": "還原檔案",
            "prerequisite": "G06",
            "type": "lesson",
            "topic": "git restore、git restore --staged"
          },
          {
            "id": "G08",
            "title": "撤銷版本變更",
            "prerequisite": "G07",
            "type": "lesson",
            "topic": "git revert、git reset 的差異與風險"
          },
          {
            "id": "G09",
            "title": "忽略指定檔案",
            "prerequisite": "G08",
            "type": "lesson",
            "topic": ".gitignore、node_modules、.env"
          },
          {
            "id": "G10",
            "title": "版本修正挑戰",
            "prerequisite": "G09",
            "type": "unit-challenge",
            "topic": "修正錯誤提交、移除暫存、還原檔案"
          }
        ]
      },
      {
        "id": "03",
        "title": "分支管理與合併",
        "nodes": [
          {
            "id": "G11",
            "title": "分支基礎",
            "prerequisite": "G10",
            "type": "lesson",
            "topic": "Branch、HEAD、main"
          },
          {
            "id": "G12",
            "title": "建立與切換分支",
            "prerequisite": "G11",
            "type": "lesson",
            "topic": "git branch、git switch、git switch -c"
          },
          {
            "id": "G13",
            "title": "分支合併",
            "prerequisite": "G12",
            "type": "lesson",
            "topic": "git merge、Fast-forward、Merge Commit"
          },
          {
            "id": "G14",
            "title": "合併衝突",
            "prerequisite": "G13",
            "type": "lesson",
            "topic": "Merge Conflict、衝突標記、衝突解決"
          },
          {
            "id": "G15",
            "title": "分支挑戰",
            "prerequisite": "G14",
            "type": "unit-challenge",
            "topic": "建立功能分支、完成開發並合併"
          }
        ]
      },
      {
        "id": "04",
        "title": "GitHub 與團隊協作",
        "nodes": [
          {
            "id": "G16",
            "title": "遠端儲存庫",
            "prerequisite": "G15",
            "type": "lesson",
            "topic": "git remote、git clone、origin"
          },
          {
            "id": "G17",
            "title": "推送遠端版本",
            "prerequisite": "G16",
            "type": "lesson",
            "topic": "git push、Upstream、git push -u"
          },
          {
            "id": "G18",
            "title": "取得遠端更新",
            "prerequisite": "G17",
            "type": "lesson",
            "topic": "git fetch、git pull、rebase 基礎觀念"
          },
          {
            "id": "G19",
            "title": "團隊協作流程",
            "prerequisite": "G18",
            "type": "lesson",
            "topic": "Pull Request、Code Review、Feature Branch"
          },
          {
            "id": "G20",
            "title": "Git 最終挑戰",
            "prerequisite": "G19",
            "type": "final-challenge",
            "topic": "團隊分支開發、PR 合併與 GitHub Pages 部署"
          }
        ]
      }
    ]
  }
];
