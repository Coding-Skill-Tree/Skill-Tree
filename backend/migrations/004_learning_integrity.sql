ALTER TABLE questions
  DROP CONSTRAINT questions_choices_array;

ALTER TABLE questions
  ADD CONSTRAINT questions_choices_array
  CHECK (
    CASE
      WHEN jsonb_typeof(choices) = 'array' THEN jsonb_array_length(choices) = 3
      ELSE false
    END
  );

ALTER TABLE quiz_attempts
  ADD CONSTRAINT quiz_attempts_module_question_count CHECK (total_questions = 5),
  ADD CONSTRAINT quiz_attempts_result_consistent
    CHECK (passed IS NULL OR (correct_count IS NOT NULL AND passed = (correct_count * 100 >= total_questions * 80))),
  ADD CONSTRAINT quiz_attempts_skill_owner_unique UNIQUE (id, user_id, skill_id);

ALTER TABLE completed_skills
  ADD CONSTRAINT completed_skills_attempt_owner_skill_fk
  FOREIGN KEY (first_passed_attempt_id, user_id, skill_id)
  REFERENCES quiz_attempts(id, user_id, skill_id)
  ON DELETE RESTRICT;
