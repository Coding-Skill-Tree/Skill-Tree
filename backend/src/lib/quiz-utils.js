export function selectQuestions(questions, count) {
  const shuffledQuestions = [...questions];
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffledQuestions[i];
    shuffledQuestions[i] = shuffledQuestions[j];
    shuffledQuestions[j] = temp;
  }
  const selectedQuestions = shuffledQuestions.slice(0, count);
  return selectedQuestions;
}
