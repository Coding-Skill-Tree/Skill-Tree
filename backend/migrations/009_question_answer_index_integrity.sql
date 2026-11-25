INSERT INTO user_progress_revisions(user_id, revision, updated_at)
SELECT user_id, count(*)::BIGINT, max(completed_at)
FROM user_skill_completions
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  revision = GREATEST(user_progress_revisions.revision, EXCLUDED.revision),
  updated_at = GREATEST(user_progress_revisions.updated_at, EXCLUDED.updated_at);

CREATE FUNCTION skill_tree_jsonb_indexes_valid(index_array JSONB, upper_bound INTEGER, allow_empty BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  item JSONB;
  index_value NUMERIC;
  integer_value INTEGER;
  seen_values INTEGER[] := ARRAY[]::INTEGER[];
BEGIN
  IF jsonb_typeof(index_array) <> 'array' THEN
    RETURN FALSE;
  END IF;

  IF NOT allow_empty AND jsonb_array_length(index_array) = 0 THEN
    RETURN FALSE;
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(index_array)
  LOOP
    IF jsonb_typeof(item) <> 'number' THEN
      RETURN FALSE;
    END IF;

    index_value := (item #>> '{}')::NUMERIC;
    IF index_value <> trunc(index_value)
       OR index_value < 0
       OR index_value >= upper_bound THEN
      RETURN FALSE;
    END IF;

    integer_value := index_value::INTEGER;
    IF integer_value = ANY(seen_values) THEN
      RETURN FALSE;
    END IF;
    seen_values := array_append(seen_values, integer_value);
  END LOOP;

  RETURN TRUE;
END;
$$;

ALTER TABLE questions
  ADD CONSTRAINT questions_correct_choices_indexes
    CHECK (skill_tree_jsonb_indexes_valid(correct_choices, jsonb_array_length(choices), false));

ALTER TABLE quiz_attempt_questions
  ADD CONSTRAINT quiz_attempt_questions_correct_choices_indexes
    CHECK (skill_tree_jsonb_indexes_valid(correct_choices_snapshot, jsonb_array_length(choices_snapshot), false)),
  ADD CONSTRAINT quiz_attempt_questions_selected_choices_indexes
    CHECK (skill_tree_jsonb_indexes_valid(selected_choices, jsonb_array_length(choices_snapshot), true));

CREATE INDEX questions_skill_published_pool_idx
  ON questions(skill_id, id)
  WHERE active = true AND status = 'published' AND deleted_at IS NULL AND is_demo = false;
