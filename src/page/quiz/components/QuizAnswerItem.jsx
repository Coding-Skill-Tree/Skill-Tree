import { useState } from "react";
import { CheckCircle, XmarkCircle } from "iconoir-react";

function QuizAnswerItem({
  questionNumber,
  questionText,
  userAnswer,
  correctAnswer,
  options,
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
        {isCorrect ? (
          <CheckCircle className="quiz-answer-correct-icon" />
        ) : (
          <XmarkCircle className="quiz-answer-incorrect-icon" />
        )}
        <span>第{questionNumber}題</span>
        <span>{questionText}</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="quiz-answer-detail">
          {options.map((option) => (
            <div key={option.id} className="quiz-answer-option">
              <div className="quiz-answer-option-header">
                <span>
                  {option.id}. {option.text}
                </span>

                {option.id === correctAnswer ? (
                  <span className="quiz-option-correct">正確選項</span>
                ) : (
                  <span className="quiz-option-incorrect">錯誤選項</span>
                )}
              </div>

              {option.id === userAnswer && (
                <span className="quiz-option-selected">你的答案</span>
              )}

              <p className="quiz-answer-option-explanation">
                解析：{option.explanation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuizAnswerItem;
