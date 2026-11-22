import "./QuizTutorialModal.css";
import { Xmark } from "iconoir-react";
import { ArrowRightCircleSolid } from "iconoir-react";

function QuizTutorialModal() {
  return (
    <div className="quiz-tutorial-modal">
      <div className="quiz-tutorial-content">
        <header className="quiz-tutorial-header">
          <span>HTML / H01</span>
          <button
            type="button"
            aria-label="關閉教學視窗"
            className="quiz-tutorial-close"
          >
            <Xmark />
          </button>
        </header>

        <h2>認識網頁與 HTML</h2>
        <p>認識 HTML 、 CSS 、 JavaScript 的用途，以及瀏覽器如何呈現網頁。</p>

        <section className="quiz-tutorial-lesson">
          <h3>教學內容</h3>
          <p>
            HTML 是用來建立網頁結構的標記語言，負責定義標題、段落、圖片等內容。
          </p>
          <p>CSS 負責網頁的外觀與排版，而 JavaScript 則負責互動功能。</p>
        </section>
        <section className="quiz-tutorial-points">
          <h3>學習重點</h3>
          <ul>
            <li>認識 HTML、CSS、JavaScript 的差異</li>
            <li>了解瀏覽器的基本用途</li>
            <li>理解 HTML 在網頁中的角色</li>
          </ul>
        </section>
        <section className="quiz-tutorial-example">
          <h3>程式碼範例</h3>
          <pre>
            <code>{`<h1>Hello HTML</h1>
        <p>這是我的第一個網頁。</p>`}</code>
          </pre>
        </section>
        <footer className="quiz-tutorial-footer">
          <button type="button" className="quiz-tutorial-start">
            開始測驗
            <ArrowRightCircleSolid />
          </button>
        </footer>
      </div>
    </div>
  );
}

export default QuizTutorialModal;
