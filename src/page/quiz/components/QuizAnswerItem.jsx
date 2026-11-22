import { useState } from "react";

function QuizAnswerItem({
  questionNumber,
  questionText,
  userAnswer,
  correctAnswer,
  explanation,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isCorrect = userAnswer === correctAnswer;
  return (
    <div className="quiz-answer-item">
      <button
        className="quiz-answer-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>第{questionNumber}題</span>
        <span>{questionText}</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="quiz-answer-detail">
          <p>你的答案：{userAnswer}</p>
          <p className={isCorrect ? "answer-correct" : "answer-incorrect"}>
            {isCorrect ? "回答正確" : "回答錯誤"}
          </p>
          <p>正確答案：{correctAnswer}</p>
          <p>答案解析：{explanation}</p>
        </div>
      )}
    </div>
  );
}

export default QuizAnswerItem;
