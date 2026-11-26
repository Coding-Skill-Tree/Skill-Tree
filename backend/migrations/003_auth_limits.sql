CREATE TABLE auth_rate_limits (
  scope VARCHAR(32) NOT NULL CHECK (scope IN ('member_login', 'admin_login', 'password_reset', 'email_verify')),
  subject_hash CHAR(64) NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  first_failure_at TIMESTAMPTZ,
  blocked_until TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, subject_hash)
);
CREATE INDEX auth_rate_limits_updated_idx ON auth_rate_limits(updated_at);
