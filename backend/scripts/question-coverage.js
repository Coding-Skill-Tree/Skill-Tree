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
    console.log(`${result}\t${skill.skillId}\t${skill.publishedQuestionCount}/${coverage.minimumPerSkill}`);
  }
  if (!coverage.activeSkillCount) {
    console.error('Question bank coverage failed: no active skills were found.');
    process.exitCode = 1;
  } else if (!coverage.ready) {
    console.error('Question bank coverage failed: add approved, published, non-demo questions for each active skill.');
    process.exitCode = 1;
  } else {
    console.log(`Question bank coverage ready for ${coverage.activeSkillCount} active skills.`);
  }
} catch (error) {
  console.error('Question bank coverage check failed:', error.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
