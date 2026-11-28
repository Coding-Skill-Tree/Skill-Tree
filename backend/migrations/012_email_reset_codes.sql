ALTER TABLE email_tokens
  ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT email_tokens_attempt_count_nonnegative CHECK (attempt_count >= 0);

-- Old password-reset URLs use a different credential format and cannot be redeemed as six-digit codes.
UPDATE email_tokens
SET used_at = now()
WHERE purpose = 'reset_password' AND used_at IS NULL;

COMMENT ON COLUMN email_tokens.attempt_count IS
  'Failed password reset code checks for this one-time, short-lived code.';
