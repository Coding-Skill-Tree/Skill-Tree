import { useState } from "react";
import "./QuizPage.css";
import { Xmark } from "iconoir-react";
import { ArrowLeftTagSolid } from "iconoir-react";
import { ArrowRightTagSolid } from "iconoir-react";
function QuizPage() {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitted, setSubmitted] = useState(false);
  const question = {
    id: 1,
    questionText: "頁面主要內容應該縫在哪個語意標籤？",
    options: {
      A: "<main>",
      B: "<aside>",
      C: "<footer>",
    },
    correctAnswer: "A",
    explanation: "main 表示頁面獨有的主要內容，讓輔助工具更容易導覽。",
  };
  const isCorrect = selectedAnswer === question.correctAnswer;
  return (
    <section className="quiz-page">
      <div className="quiz-container">
        <div className="quiz-header">
          <p>HTML / QUESTION 1 OF 5</p>
          <button className="quiz-close-button" aria-label="關閉測驗">
            <Xmark />
          </button>
        </div>
        <div className="quiz-progress">
          <div className="quiz-progress-fill"></div>
        </div>
        <h2 className="quiz-question-title">{question.questionText}</h2>
        <div className="quiz-options">
          <button
            className={`quiz-option
            ${selectedAnswer === "A" ? "selected" : ""}
            ${isSubmitted && selectedAnswer === "A" && selectedAnswer !== question.correctAnswer ? "wrong" : ""}`}
            onClick={() => setSelectedAnswer("A")}
            disabled={isSubmitted}
          >
            <span>A</span>
            <span>{question.options.A}</span>
          </button>
          <button
            className={`quiz-option
            ${selectedAnswer === "B" ? "selected" : ""}
            ${isSubmitted && selectedAnswer === "B" && selectedAnswer !== question.correctAnswer ? "wrong" : ""}`}
            onClick={() => setSelectedAnswer("B")}
            disabled={isSubmitted}
          >
            <span>B</span>
            <span>{question.options.B}</span>
          </button>
          <button
            className={`quiz-option
            ${selectedAnswer === "C" ? "selected" : ""}
            ${isSubmitted && selectedAnswer === "C" && selectedAnswer !== question.correctAnswer ? "wrong" : ""}`}
            onClick={() => setSelectedAnswer("C")}
            disabled={isSubmitted}
          >
            <span>C</span>
            <span>{question.options.C}</span>
          </button>
        </div>
        {isSubmitted && (
          <p className={isCorrect ? "correct-text" : "wrong-text"}>
            {isCorrect ? "回答正確" : "回答錯誤"}
          </p>
        )}
        <div className="quiz-navigation">
          <button className="quiz-last-button">
            <ArrowLeftTagSolid />
            上一題
          </button>
          <button className="quiz-next-button">
            下一題
            <ArrowRightTagSolid />
          </button>
          <button
            className="quiz-submit-button"
            onClick={() => setSubmitted(true)}
            disabled={selectedAnswer === null}
          >
            提交測驗
          </button>
        </div>
      </div>
    </section>
  );
}

export default QuizPage;
