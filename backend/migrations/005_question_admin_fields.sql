ALTER TABLE questions
  ADD COLUMN difficulty VARCHAR(16) NOT NULL DEFAULT 'intermediate',
  ADD COLUMN status VARCHAR(12) NOT NULL DEFAULT 'published',
  ADD COLUMN deleted_at TIMESTAMPTZ;

UPDATE questions
SET status = CASE WHEN active THEN 'published' ELSE 'draft' END;

ALTER TABLE questions
  ADD CONSTRAINT questions_difficulty_check
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  ADD CONSTRAINT questions_status_check
    CHECK (status IN ('draft', 'published'));

CREATE INDEX questions_admin_status_updated_idx
  ON questions(status, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;
