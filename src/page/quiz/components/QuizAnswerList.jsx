import QuizAnswerItem from "./QuizAnswerItem";

function QuizAnswerList() {
  const questions = [
    {
      id: 1,
      questionText: "頁面主要內容應該要放在哪個語意標籤？",
      userAnswer: "B",
      correctAnswer: "A",
      options: [
        {
          id: "A",
          text: "<main>",
          explanation: "代表網頁的主要內容。",
        },
        {
          id: "B",
          text: "<aside>",
          explanation: "代表補充內容或側邊欄。",
        },
        {
          id: "C",
          text: "<footer>",
          explanation: "代表網頁的頁尾資訊。",
        },
      ],
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
          options={question.options}
        />
      ))}
    </div>
  );
}

export default QuizAnswerList;
