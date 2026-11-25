export async function listPublishedQuestionsForSkill(database, skillId) {
  const result = await database.query(
    `SELECT q.id::text AS id, q.skill_id AS "skillId", q.prompt, q.choices,
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

export async function getPublishedQuestionCoverage(database, minimumPerSkill = 5) {
  const result = await database.query(
    `SELECT s.id AS "skillId", s.title,
            count(q.id)::int AS "publishedQuestionCount"
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
  }));
  return {
    minimumPerSkill,
    activeSkillCount: skills.length,
    skills,
    ready: skills.length > 0 && skills.every((skill) => skill.meetsMinimum),
  };
}
