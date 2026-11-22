import QuizAnswerItem from "./QuizAnswerItem";

function QuizAnswerList() {
  const questions = [
    {
      id: 1,
      questionText: "頁面主要內容應該要放在哪個語意標籤？",
      userAnswer: "<aside>",
      correctAnswer: "<main>",
      explanation: "main 標籤用來表示網頁的主要內容。",
    },
    {
      id: 2,
      questionText: "哪個標籤用來建立超連結？",
      userAnswer: "<a>",
      correctAnswer: "<a>",
      explanation: "a 標籤用來建立超連結。",
    },
  ];
  return (
    <div className="quiz-answer-list">
      <h3>各題作答結果</h3>
      {questions.map((question) => (
        <QuizAnswerItem
          key={question.id}
          questionNumber={question.id}
          questionText={question.questionText}
          userAnswer={question.userAnswer}
          correctAnswer={question.correctAnswer}
          explanation={question.explanation}
        />
      ))}
    </div>
  );
}

export default QuizAnswerList;
