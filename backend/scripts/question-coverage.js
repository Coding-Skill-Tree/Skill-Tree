import 'dotenv/config';
import { pool, closePool } from '../src/db/pool.js';
import { getPublishedQuestionCoverage } from '../src/services/question-bank.js';

const minimumPerSkill = Number(process.env.MIN_QUESTIONS_PER_SKILL || 5);
if (!Number.isSafeInteger(minimumPerSkill) || minimumPerSkill < 1 || minimumPerSkill > 1000) {
  throw new Error('MIN_QUESTIONS_PER_SKILL 必須是 1 到 1000 的整數');
}

try {
  const coverage = await getPublishedQuestionCoverage(pool, minimumPerSkill);
  for (const skill of coverage.skills) {
    const result = skill.meetsMinimum ? 'OK' : 'MISSING';
    console.log(
      `${result}\tC_ELIGIBLE=${skill.cQuizEligibleQuestionCount}/${coverage.cQuizMinimum}\t${skill.skillId}`
      + `\tpublished=${skill.publishedQuestionCount}/${coverage.minimumPerSkill}`
      + `\tcQuiz3Single=${skill.cQuizEligibleQuestionCount}/${coverage.cQuizMinimum}`,
    );
  }
  if (!coverage.activeSkillCount) {
    console.error('Question bank coverage failed: no active skills were found.');
    process.exitCode = 1;
  } else if (!coverage.ready) {
    console.error('Question bank coverage failed: add approved, published, non-demo questions for each active skill.');
    process.exitCode = 1;
  } else {
    console.log(`General question bank coverage meets ${coverage.minimumPerSkill} published questions for all ${coverage.activeSkillCount} active skills.`);
    console.log(`C v1 requires ${coverage.cQuizMinimum} eligible questions per MVP skill; the five MVP skill IDs still need confirmation.`);
  }
} catch (error) {
  console.error('Question bank coverage check failed:', error.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
