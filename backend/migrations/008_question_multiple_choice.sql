-- Preserve the existing single-answer fields while adding the canonical
-- multiple-answer and per-option explanation contract for modules C and E.
ALTER TABLE questions
  DROP CONSTRAINT questions_choices_array,
  DROP CONSTRAINT questions_correct_choice_check;

ALTER TABLE questions
  ADD COLUMN answer_mode VARCHAR(10) NOT NULL DEFAULT 'single',
  ADD COLUMN correct_choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN choice_explanations JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE questions AS q
SET correct_choices = jsonb_build_array(q.correct_choice),
    choice_explanations = (
      SELECT COALESCE(jsonb_agg(to_jsonb(''::text) ORDER BY option_index), '[]'::jsonb)
      FROM generate_series(1, jsonb_array_length(q.choices)) AS option_index
    );

ALTER TABLE questions
  ADD CONSTRAINT questions_choices_array
    CHECK (jsonb_typeof(choices) = 'array' AND jsonb_array_length(choices) BETWEEN 2 AND 10),
  ADD CONSTRAINT questions_correct_choice_range
    CHECK (correct_choice BETWEEN 0 AND 9 AND correct_choice < jsonb_array_length(choices)),
  ADD CONSTRAINT questions_answer_mode_check
    CHECK (answer_mode IN ('single', 'multiple')),
  ADD CONSTRAINT questions_correct_choices_array
    CHECK (
      jsonb_typeof(correct_choices) = 'array'
      AND jsonb_array_length(correct_choices) BETWEEN 1 AND jsonb_array_length(choices)
      AND (
        (answer_mode = 'single' AND jsonb_array_length(correct_choices) = 1)
        OR (answer_mode = 'multiple' AND jsonb_array_length(correct_choices) >= 2)
      )
    ),
  ADD CONSTRAINT questions_choice_explanations_array
    CHECK (
      jsonb_typeof(choice_explanations) = 'array'
      AND jsonb_array_length(choice_explanations) = jsonb_array_length(choices)
    );

ALTER TABLE quiz_attempt_questions
  DROP CONSTRAINT quiz_attempt_questions_correct_choice_snapshot_check,
  DROP CONSTRAINT quiz_attempt_questions_selected_choice_check;

ALTER TABLE quiz_attempt_questions
  ADD COLUMN answer_mode_snapshot VARCHAR(10) NOT NULL DEFAULT 'single',
  ADD COLUMN correct_choices_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN choice_explanations_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN selected_choices JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE quiz_attempt_questions AS aq
SET correct_choices_snapshot = jsonb_build_array(aq.correct_choice_snapshot),
    choice_explanations_snapshot = (
      SELECT COALESCE(jsonb_agg(to_jsonb(''::text) ORDER BY option_index), '[]'::jsonb)
      FROM generate_series(1, jsonb_array_length(aq.choices_snapshot)) AS option_index
    ),
    selected_choices = CASE
      WHEN aq.selected_choice IS NULL THEN '[]'::jsonb
      ELSE jsonb_build_array(aq.selected_choice)
    END;

-- Keep existing single-answer quiz writers working during the C-module API
-- migration. New quiz writers should send the four canonical snapshot fields.
CREATE FUNCTION sync_legacy_quiz_choice_snapshots() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.correct_choices_snapshot = '[]'::jsonb THEN
    NEW.correct_choices_snapshot = jsonb_build_array(NEW.correct_choice_snapshot);
  END IF;

  IF NEW.choice_explanations_snapshot = '[]'::jsonb THEN
    SELECT COALESCE(jsonb_agg(to_jsonb(''::text) ORDER BY option_index), '[]'::jsonb)
    INTO NEW.choice_explanations_snapshot
    FROM generate_series(1, jsonb_array_length(NEW.choices_snapshot)) AS option_index;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.selected_choices = '[]'::jsonb AND NEW.selected_choice IS NOT NULL THEN
    NEW.selected_choices = jsonb_build_array(NEW.selected_choice);
  ELSIF TG_OP = 'UPDATE'
        AND NEW.selected_choice IS DISTINCT FROM OLD.selected_choice
        AND NEW.selected_choices IS NOT DISTINCT FROM OLD.selected_choices THEN
    NEW.selected_choices = CASE
      WHEN NEW.selected_choice IS NULL THEN '[]'::jsonb
      ELSE jsonb_build_array(NEW.selected_choice)
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER quiz_attempt_questions_sync_legacy_choices
  BEFORE INSERT OR UPDATE ON quiz_attempt_questions
  FOR EACH ROW EXECUTE FUNCTION sync_legacy_quiz_choice_snapshots();

ALTER TABLE quiz_attempt_questions
  ADD CONSTRAINT quiz_attempt_questions_correct_choice_snapshot_range
    CHECK (correct_choice_snapshot BETWEEN 0 AND 9 AND correct_choice_snapshot < jsonb_array_length(choices_snapshot)),
  ADD CONSTRAINT quiz_attempt_questions_selected_choice_range
    CHECK (selected_choice IS NULL OR (selected_choice BETWEEN 0 AND 9 AND selected_choice < jsonb_array_length(choices_snapshot))),
  ADD CONSTRAINT quiz_attempt_questions_answer_mode_snapshot_check
    CHECK (answer_mode_snapshot IN ('single', 'multiple')),
  ADD CONSTRAINT quiz_attempt_questions_correct_choices_snapshot_array
    CHECK (
      jsonb_typeof(correct_choices_snapshot) = 'array'
      AND jsonb_array_length(correct_choices_snapshot) BETWEEN 1 AND jsonb_array_length(choices_snapshot)
      AND (
        (answer_mode_snapshot = 'single' AND jsonb_array_length(correct_choices_snapshot) = 1)
        OR (answer_mode_snapshot = 'multiple' AND jsonb_array_length(correct_choices_snapshot) >= 2)
      )
    ),
  ADD CONSTRAINT quiz_attempt_questions_choice_explanations_snapshot_array
    CHECK (
      jsonb_typeof(choice_explanations_snapshot) = 'array'
      AND jsonb_array_length(choice_explanations_snapshot) = jsonb_array_length(choices_snapshot)
    ),
  ADD CONSTRAINT quiz_attempt_questions_selected_choices_array
    CHECK (
      jsonb_typeof(selected_choices) = 'array'
      AND jsonb_array_length(selected_choices) <= jsonb_array_length(choices_snapshot)
    );
