INSERT INTO skill_categories (id, name, sort_order) VALUES
  ('web-foundations', '網頁基礎', 1),
  ('styling-layout', '樣式與版面', 2),
  ('programming', '程式與型別', 3),
  ('frameworks', '框架與應用', 4),
  ('tooling', '開發工具與協作', 5),
  ('quality-data', '資料串接與品質', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO skills (id, category_id, title, description, learning_items, position_x, position_y, sort_order) VALUES
  ('html-basics', 'web-foundations', 'HTML 基礎', '理解文件結構與常見標籤。', '["語意化標籤","文件結構","連結與圖片"]', 0, 0, 1),
  ('html-forms', 'web-foundations', 'HTML 表單', '建立可理解、可操作的表單。', '["label 關聯","輸入型別","表單送出"]', 1, 1, 2),
  ('css-basics', 'styling-layout', 'CSS 基礎', '使用選擇器、盒模型與排版樣式。', '["選擇器","盒模型","基本排版"]', 2, 0, 1),
  ('rwd', 'styling-layout', '響應式排版', '讓內容適應手機、平板與桌機。', '["Mobile first","媒體查詢","彈性版型"]', 3, 1, 2),
  ('js-basics', 'programming', 'JavaScript 基礎', '掌握變數、條件、函式與陣列。', '["變數與型別","條件與迴圈","函式"]', 4, 0, 1),
  ('js-async', 'programming', '非同步 JavaScript', '理解 Promise 與 async/await。', '["Promise","async/await","錯誤處理"]', 5, 1, 2),
  ('ts-basics', 'programming', 'TypeScript 概念', '認識型別註記與靜態檢查。', '["基本型別","型別推論","介面概念"]', 6, 0, 3),
  ('react-basics', 'frameworks', 'React 基礎', '以元件、props 與 state 建立介面。', '["元件","props","state"]', 7, 1, 1),
  ('terminal-basics', 'tooling', '終端機入門', '使用常見命令列操作。', '["路徑","檔案操作","npm scripts"]', 8, 0, 1),
  ('git-basics', 'tooling', 'Git 基礎', '記錄變更並管理版本。', '["status","add / commit","log"]', 9, 1, 2),
  ('git-branches', 'tooling', '分支與 Pull Request', '以分支進行協作與程式碼檢查。', '["branch","merge","Pull Request"]', 10, 0, 3),
  ('npm-basics', 'tooling', 'npm 基礎', '管理套件與專案指令。', '["package.json","安裝套件","scripts"]', 11, 1, 4),
  ('http-basics', 'quality-data', 'HTTP 與 API', '理解請求、回應與狀態碼。', '["HTTP 方法","狀態碼","JSON"]', 12, 0, 1),
  ('api-integration', 'quality-data', 'API 串接', '以非同步請求整合前後端資料。', '["fetch","載入與錯誤狀態","資料驗證"]', 13, 1, 2),
  ('testing-basics', 'quality-data', '測試基礎', '用測試保護功能與回歸品質。', '["測試案例","單元測試","整合測試"]', 14, 0, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id) VALUES
  ('html-forms', 'html-basics'), ('css-basics', 'html-basics'), ('rwd', 'html-basics'), ('rwd', 'css-basics'),
  ('js-async', 'js-basics'), ('ts-basics', 'js-basics'),
  ('react-basics', 'html-basics'), ('react-basics', 'css-basics'), ('react-basics', 'js-basics'),
  ('git-basics', 'terminal-basics'), ('git-branches', 'git-basics'), ('npm-basics', 'terminal-basics'),
  ('api-integration', 'http-basics'), ('api-integration', 'js-async'), ('testing-basics', 'js-basics')
ON CONFLICT DO NOTHING;

-- Remove only the previous generated demo rows when no attempt snapshot uses them.
-- The attempt-question foreign key protects any fixture that has already been used.
DELETE FROM questions AS q
WHERE q.skill_id = 'html-basics'
  AND q.is_demo = true
  AND q.prompt LIKE '[展示資料] HTML 示範題 %'
  AND NOT EXISTS (
    SELECT 1 FROM quiz_attempt_questions AS aq WHERE aq.question_id = q.id
  );

INSERT INTO questions (skill_id, prompt, choices, correct_choice, explanation, is_demo) VALUES
  ('html-basics', '[測試展示題] HTML-01：`<main>` 最適合用來標示什麼？',
   '["頁面的主要內容","網站的版權資訊","所有導覽連結"]'::jsonb, 0,
   '`<main>` 標示頁面主要內容；同一頁通常只放一個可見的 `<main>`。', true),
  ('html-basics', '[測試展示題] HTML-02：點擊後要執行「送出表單」動作，優先使用哪個元素？',
   '["`<a href=\"#\">`","`<button type=\"submit\">`","`<span>`"]'::jsonb, 1,
   '送出表單是動作，使用 submit button 能保留表單語意與鍵盤操作。', true),
  ('html-basics', '[測試展示題] HTML-03：如何讓表單標籤和輸入欄位建立明確關聯？',
   '["把 placeholder 設成欄位名稱","讓 label 的 for 等於 input 的 id","只在欄位旁放一段文字"]'::jsonb, 1,
   'label 的 for 屬性應與對應 input 的 id 相同，點擊標籤也能聚焦欄位。', true),
  ('html-basics', '[測試展示題] HTML-04：資訊性圖片的 alt 文字應該怎麼寫？',
   '["重複寫「圖片」","留空並把說明放在檔名","簡潔描述圖片傳達的資訊"]'::jsonb, 2,
   '資訊性圖片的替代文字應傳達必要內容；純裝飾圖片才通常使用空 alt。', true),
  ('html-basics', '[測試展示題] HTML-05：頁面標題層級最適合依什麼原則安排？',
   '["只依字體大小選 h1 到 h6","每一段都從 h1 開始","依內容階層安排，讓子標題隸屬於上層標題"]'::jsonb, 2,
   '標題元素應反映文件大綱；視覺大小再由 CSS 調整。', true),
  ('html-basics', '[測試展示題] HTML-06：哪個欄位型別能表達電子郵件輸入並提供基本瀏覽器檢查？',
   '["`type=\"text\"`","`type=\"email\"`","`type=\"image\"`"]'::jsonb, 1,
   '`type="email"` 能表達欄位用途並觸發瀏覽器的基本格式檢查；伺服器仍須驗證。', true),
  ('html-basics', '[測試展示題] HTML-07：一組連往網站主要區域的導覽連結應放在哪個語意元素？',
   '["`<nav>`","`<footer>`","`<strong>`"]'::jsonb, 0,
   '`<nav>` 用來標記重要的導覽區塊，協助理解頁面結構。', true),
  ('html-basics', '[測試展示題] HTML-08：表格中的欄位標題應優先使用哪個元素？',
   '["`<caption>`","`<td>`","`<th scope=\"col\">`"]'::jsonb, 2,
   '`<th>` 表示標題儲存格，scope 可說明它是欄或列的標題；caption 則描述整張表。', true)
ON CONFLICT (skill_id, prompt) DO UPDATE SET
  choices = EXCLUDED.choices,
  correct_choice = EXCLUDED.correct_choice,
  explanation = EXCLUDED.explanation,
  active = true,
  is_demo = true,
  updated_at = now();
