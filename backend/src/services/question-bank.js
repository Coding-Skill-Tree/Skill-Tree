export async function listPublishedQuestionsForSkill(database, skillId) {
  const result = await database.query(
    `SELECT q.id::text AS id, q.skill_id AS "skillId", q.prompt, q.choices,
            q.correct_choice AS "correctChoice",
            q.answer_mode AS "answerMode", q.correct_choices AS "correctChoices",
            q.choice_explanations AS "choiceExplanations", q.explanation,
            q.difficulty
     FROM questions q
     JOIN skills s ON s.id = q.skill_id
     JOIN skill_categories c ON c.id = s.category_id
     WHERE q.skill_id = $1 AND q.active = true AND q.status = 'published'
       AND q.deleted_at IS NULL AND q.is_demo = false
       AND s.active = true AND c.active = true
     ORDER BY q.id`,
    [skillId],
  );
  return result.rows;
}

const C_QUIZ_QUESTION_FILTER = `
  q.active = true
  AND q.status = 'published'
  AND q.deleted_at IS NULL
  AND q.is_demo = false
  AND q.answer_mode = 'single'
  AND jsonb_array_length(q.choices) = 3
  AND q.correct_choices IN ('[0]'::jsonb, '[1]'::jsonb, '[2]'::jsonb)
  AND jsonb_array_length(q.choice_explanations) = 3
  AND btrim(q.prompt) <> ''
  AND btrim(q.explanation) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(q.choices || q.choice_explanations) AS item(value)
    WHERE jsonb_typeof(item.value) <> 'string' OR btrim(item.value #>> '{}') = ''
  )`;

/**
 * Internal C-v1 availability check. Pass the caller's transaction client when
 * this is used while creating an attempt, so the gate and inserted snapshot
 * share the same database transaction. No lesson-ready schema exists yet;
 * the gate is based on active catalog, prerequisites and eligible questions.
 */
export async function getQuizAvailability(database, { userId, skillId, requiredQuestionCount = 5 }) {
  if (!/^[1-9]\d*$/u.test(String(userId))) {
    throw new TypeError('Quiz availability requires a verified member ID.');
  }
  if (typeof skillId !== 'string' || !skillId || skillId.length > 80 || skillId !== skillId.trim()) {
    throw new TypeError('Quiz availability requires a valid skill ID.');
  }
  if (!Number.isSafeInteger(requiredQuestionCount) || requiredQuestionCount < 1) {
    throw new TypeError('requiredQuestionCount must be a positive safe integer.');
  }

  const skillResult = await database.query(
    `SELECT s.id AS "skillId"
     FROM skills s
     JOIN skill_categories c ON c.id = s.category_id
     WHERE s.id = $1 AND s.active = true AND c.active = true`,
    [skillId],
  );
  if (!skillResult.rowCount) {
    return {
      skillId,
      available: false,
      reason: 'SKILL_NOT_FOUND',
      missingPrerequisiteSkillIds: [],
      availableQuestionCount: 0,
      requiredQuestionCount,
    };
  }

  const prerequisiteResult = await database.query(
    `SELECT prerequisite.prerequisite_skill_id AS "skillId"
     FROM skill_prerequisites prerequisite
     LEFT JOIN user_skill_completions completion
       ON completion.skill_id = prerequisite.prerequisite_skill_id
      AND completion.user_id = $2
     WHERE prerequisite.skill_id = $1 AND completion.skill_id IS NULL
     ORDER BY prerequisite.prerequisite_skill_id`,
    [skillId, userId],
  );
  const questionCountResult = await database.query(
    `SELECT count(*)::int AS count
     FROM questions q
     WHERE q.skill_id = $1 AND ${C_QUIZ_QUESTION_FILTER}`,
    [skillId],
  );
  const availableQuestionCount = questionCountResult.rows[0].count;
  const missingPrerequisiteSkillIds = prerequisiteResult.rows.map((row) => row.skillId);
  const reason = missingPrerequisiteSkillIds.length > 0
    ? 'SKILL_LOCKED'
    : availableQuestionCount < requiredQuestionCount
      ? 'INSUFFICIENT_QUESTIONS'
      : null;

  return {
    skillId,
    available: reason === null,
    reason,
    missingPrerequisiteSkillIds,
    availableQuestionCount,
    requiredQuestionCount,
  };
}

export async function getPublishedQuestionCoverage(database, minimumPerSkill = 5, cQuizMinimum = 5) {
  const result = await database.query(
    `SELECT s.id AS "skillId", s.title,
            count(q.id)::int AS "publishedQuestionCount",
            (count(q.id) FILTER (
              WHERE q.answer_mode = 'single'
                AND jsonb_typeof(q.choices) = 'array'
                AND jsonb_array_length(q.choices) = 3
                AND jsonb_typeof(q.correct_choices) = 'array'
                AND jsonb_array_length(q.correct_choices) = 1
                AND jsonb_typeof(q.choice_explanations) = 'array'
                AND jsonb_array_length(q.choice_explanations) = 3
                AND btrim(q.explanation) <> ''
                AND NOT EXISTS (
                  SELECT 1 FROM jsonb_array_elements(q.choices) AS item(value)
                  WHERE jsonb_typeof(item.value) <> 'string' OR btrim(item.value #>> '{}') = ''
                )
                AND NOT EXISTS (
                  SELECT 1 FROM jsonb_array_elements(q.choice_explanations) AS item(value)
                  WHERE jsonb_typeof(item.value) <> 'string' OR btrim(item.value #>> '{}') = ''
                )
            ))::int AS "cQuizEligibleQuestionCount"
     FROM skills s
     JOIN skill_categories c ON c.id = s.category_id AND c.active = true
     LEFT JOIN questions q ON q.skill_id = s.id
       AND q.active = true AND q.status = 'published'
       AND q.deleted_at IS NULL AND q.is_demo = false
     WHERE s.active = true
     GROUP BY s.id, s.title, c.sort_order, s.sort_order
     ORDER BY c.sort_order, s.sort_order, s.title`,
  );
  const skills = result.rows.map((row) => ({
    ...row,
    meetsMinimum: row.publishedQuestionCount >= minimumPerSkill,
    meetsCQuizMinimum: row.cQuizEligibleQuestionCount >= cQuizMinimum,
  }));
  return {
    minimumPerSkill,
    cQuizMinimum,
    activeSkillCount: skills.length,
    skills,
    ready: skills.length > 0 && skills.every((skill) => skill.meetsMinimum),
  };
}
