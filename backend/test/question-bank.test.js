import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getQuizAvailability, listPublishedQuestionsForSkill } from '../src/services/question-bank.js';

function availabilityDatabase({ skill = true, missingPrerequisites = [], questionCount = 5 } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FROM skills s')) {
        return { rows: skill ? [{ skillId: values[0] }] : [], rowCount: skill ? 1 : 0 };
      }
      if (sql.includes('FROM skill_prerequisites prerequisite')) {
        return { rows: missingPrerequisites.map((skillId) => ({ skillId })), rowCount: missingPrerequisites.length };
      }
      if (sql.includes('SELECT count(*)::int AS count')) {
        return { rows: [{ count: questionCount }], rowCount: 1 };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

test('quiz availability opens only when the member has prerequisites and enough eligible questions', async () => {
  const database = availabilityDatabase();
  const result = await getQuizAvailability(database, { userId: '42', skillId: 'html-basics' });

  assert.deepEqual(result, {
    skillId: 'html-basics',
    available: true,
    reason: null,
    missingPrerequisiteSkillIds: [],
    availableQuestionCount: 5,
    requiredQuestionCount: 5,
  });
  assert.equal(database.calls.length, 3);
  assert.ok(database.calls[2].sql.includes("q.status = 'published'"));
  assert.ok(database.calls[2].sql.includes('q.is_demo = false'));
  assert.ok(database.calls[2].sql.includes("q.answer_mode = 'single'"));
});

test('quiz availability reports missing prerequisites before question shortage', async () => {
  const result = await getQuizAvailability(
    availabilityDatabase({ missingPrerequisites: ['html-basics'], questionCount: 0 }),
    { userId: '42', skillId: 'css-basics' },
  );

  assert.equal(result.available, false);
  assert.equal(result.reason, 'SKILL_LOCKED');
  assert.deepEqual(result.missingPrerequisiteSkillIds, ['html-basics']);
  assert.equal(result.availableQuestionCount, 0);
});

test('quiz availability reports a missing skill without querying member progress or questions', async () => {
  const database = availabilityDatabase({ skill: false });
  const result = await getQuizAvailability(database, { userId: '42', skillId: 'missing' });

  assert.equal(result.reason, 'SKILL_NOT_FOUND');
  assert.equal(result.availableQuestionCount, 0);
  assert.equal(database.calls.length, 1);
});

test('quiz availability validates trusted member and skill identifiers', async () => {
  await assert.rejects(getQuizAvailability(availabilityDatabase(), { userId: '0', skillId: 'html-basics' }), TypeError);
  await assert.rejects(getQuizAvailability(availabilityDatabase(), { userId: '42', skillId: ' html-basics ' }), TypeError);
});

test('shared question lookup stays server-only and returns answer indexes for trusted routes', async () => {
  const question = { id: 'q1', correctChoice: 1, correctChoices: [1] };
  let query;
  const rows = await listPublishedQuestionsForSkill({
    async query(sql, values) {
      query = { sql, values };
      return { rows: [question] };
    },
  }, 'html-basics');

  assert.deepEqual(rows, [question]);
  assert.deepEqual(query.values, ['html-basics']);
  assert.match(query.sql, /correct_choice AS "correctChoice"/u);
  assert.match(query.sql, /q\.is_demo = false/u);
});
