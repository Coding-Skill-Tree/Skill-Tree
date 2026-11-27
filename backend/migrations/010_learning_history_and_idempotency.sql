-- Keep quiz history in its owning tables and expose a read-only projection for
-- the learning-history API. Do not copy quiz rows into a second history table.
ALTER TABLE quiz_attempts
  ADD COLUMN skill_title_snapshot VARCHAR(120),
  ADD COLUMN idempotency_key UUID,
  ADD COLUMN idempotency_fingerprint BYTEA;

UPDATE quiz_attempts AS attempt
SET skill_title_snapshot = COALESCE(NULLIF(btrim(skill.title), ''), attempt.skill_id)
FROM skills AS skill
WHERE skill.id = attempt.skill_id;

ALTER TABLE quiz_attempts
  ALTER COLUMN skill_title_snapshot SET NOT NULL,
  ADD CONSTRAINT quiz_attempts_skill_title_snapshot_nonempty
    CHECK (length(btrim(skill_title_snapshot)) > 0),
  ADD CONSTRAINT quiz_attempts_completed_result_required
    CHECK (
      status <> 'completed'
      OR (completed_at IS NOT NULL AND correct_count IS NOT NULL AND passed IS NOT NULL)
    ) NOT VALID,
  ADD CONSTRAINT quiz_attempts_idempotency_pair
    CHECK (
      (idempotency_key IS NULL AND idempotency_fingerprint IS NULL)
      OR (
        idempotency_key IS NOT NULL
        AND idempotency_fingerprint IS NOT NULL
        AND octet_length(idempotency_fingerprint) = 32
      )
    );

CREATE UNIQUE INDEX quiz_attempts_user_idempotency_key_unique
  ON quiz_attempts(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX quiz_attempts_user_completed_history_idx
  ON quiz_attempts(user_id, completed_at DESC, id DESC)
  WHERE status = 'completed' AND completed_at IS NOT NULL;

COMMENT ON COLUMN quiz_attempts.skill_title_snapshot IS
  'Skill display name captured when the attempt starts; keeps historical names stable.';
COMMENT ON COLUMN quiz_attempts.idempotency_key IS
  'Client UUID from Idempotency-Key; unique per member for the lifetime of this attempt.';
COMMENT ON COLUMN quiz_attempts.idempotency_fingerprint IS
  'SHA-256 of canonical client input bytes; 32 bytes, used to reject key reuse with a different request.';

CREATE VIEW user_learning_activity_history AS
SELECT
  attempt.id AS activity_id,
  attempt.user_id,
  'quiz_attempt'::TEXT AS activity_type,
  attempt.skill_id,
  attempt.skill_title_snapshot AS title,
  attempt.catalog_version,
  attempt.correct_count,
  attempt.total_questions,
  attempt.passed,
  attempt.completed_at
FROM quiz_attempts AS attempt
WHERE attempt.status = 'completed'
  AND attempt.completed_at IS NOT NULL
  AND attempt.correct_count IS NOT NULL
  AND attempt.passed IS NOT NULL;

COMMENT ON VIEW user_learning_activity_history IS
  'Read-only learning-history projection over completed quiz attempts; quiz data remains owned by quiz_attempts.';

-- XP is a signal for D to apply its own award policy. New producers leave
-- amount NULL; the actual awarded amount is recorded in xp_ledger.
ALTER TABLE xp_outbox
  DROP CONSTRAINT xp_outbox_amount_check,
  ALTER COLUMN amount DROP NOT NULL,
  ADD COLUMN lease_token UUID,
  ADD COLUMN lease_expires_at TIMESTAMPTZ,
  ADD CONSTRAINT xp_outbox_amount_positive_when_set
    CHECK (amount IS NULL OR amount > 0),
  ADD CONSTRAINT xp_outbox_lease_pair
    CHECK ((lease_token IS NULL) = (lease_expires_at IS NULL));

CREATE INDEX xp_outbox_expired_lease_idx
  ON xp_outbox(lease_expires_at, created_at)
  WHERE status = 'processing';

CREATE INDEX xp_outbox_retry_claim_idx
  ON xp_outbox(available_at, created_at)
  WHERE status IN ('pending', 'failed') AND attempts < 12;

COMMENT ON COLUMN xp_outbox.amount IS
  'Legacy optional field. New producers leave NULL; D computes the award and writes the final amount to xp_ledger.';
COMMENT ON COLUMN xp_outbox.lease_token IS
  'Fencing token for the current D worker claim; required when acknowledging or failing a leased event.';
COMMENT ON COLUMN xp_outbox.lease_expires_at IS
  'Claim expiry; processing rows with NULL or expired lease are reclaimable after worker interruption.';
COMMENT ON CONSTRAINT quiz_attempts_completed_result_required ON quiz_attempts IS
  'NOT VALID for legacy-row safety; enforced for new or updated rows and may be validated after legacy data audit.';
