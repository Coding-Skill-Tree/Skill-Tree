import QuizAnswerList from "./components/QuizAnswerList.jsx";
import "./QuizResultPage.css";
import { Refresh } from "iconoir-react";
import { ArrowRight } from "iconoir-react";

function QuizResultPage() {
  const correctCount = 3;
  const totalQuestions = 5;
  const isPassed = correctCount >= 4;
  const canRetry = true;
  return (
    <section className="quiz-result-page">
      <div className="quiz-result-container">
        <div className={`quiz-result-icon ${isPassed ? "passed" : "failed"}`}>
          ✧
        </div>
        <p className="quiz-result-response">
          {isPassed ? "SKII UNLOCKED" : "CHALLENGE FAILED"}
        </p>
        <h2 className="quiz-result-title">
          {isPassed ? "技能掌握，前進一步" : "挑戰未完成，再接再厲"}
        </h2>
        <div className="quiz-result-description">
          <p>
            你答對了{correctCount}/{totalQuestions}題。
          </p>
          <p>
            {isPassed
              ? "技能已點亮，繼續探索下一個節點。"
              : "尚未達到通過標準，可以重新挑戰"}
          </p>
        </div>
        <p className="quiz-result-xpCount">{"+ 0 XP"}</p>
        <QuizAnswerList />
        <div className="quiz-result-change">
          {canRetry && (
            <button className="quiz-result-retry-button">
              重新挑戰
              <Refresh />
            </button>
          )}
          <button className="quiz-result-back-button">
            返回技能樹
            <ArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
}

export default QuizResultPage;
