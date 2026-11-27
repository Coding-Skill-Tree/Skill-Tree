import { randomInt } from 'node:crypto';

export function selectQuestions(questions, count, chooseIndex = randomInt) {
  if (!Array.isArray(questions) || !Number.isSafeInteger(count) || count < 0 || count > questions.length) {
    throw new TypeError('Question count must be between zero and the available question count.');
  }

  const shuffledQuestions = [...questions];
  for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
    const otherIndex = chooseIndex(index + 1);
    [shuffledQuestions[index], shuffledQuestions[otherIndex]] = [
      shuffledQuestions[otherIndex],
      shuffledQuestions[index],
    ];
  }
  return shuffledQuestions.slice(0, count);
}
