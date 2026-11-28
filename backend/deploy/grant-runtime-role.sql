-- Run once as a database owner after migrations have created the tables.
-- Set the runtime password interactively with `\password skill_tree_runtime` in psql.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'skill_tree_runtime') THEN
    CREATE ROLE skill_tree_runtime
      LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  END IF;
END
$$;

ALTER ROLE skill_tree_runtime
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;

-- Re-running this script removes this role's old direct grants before
-- applying the current allowlist, so revoked access does not survive a change.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM skill_tree_runtime;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM skill_tree_runtime;

SELECT format('GRANT CONNECT ON DATABASE %I TO skill_tree_runtime', current_database()) \gexec
GRANT USAGE ON SCHEMA public TO skill_tree_runtime;

-- Runtime queries and mutations used by the current API.
GRANT SELECT (id, email_normalized, password_hash, email_verified_at, suspended_at, created_at)
  ON TABLE users TO skill_tree_runtime;
GRANT INSERT (email_normalized, password_hash, email_verified_at) ON TABLE users TO skill_tree_runtime;
GRANT UPDATE (password_hash, email_verified_at, suspended_at, updated_at) ON TABLE users TO skill_tree_runtime;
GRANT SELECT (user_id, nickname, avatar_id, role, level, route, onboarding_completed)
  ON TABLE member_profiles TO skill_tree_runtime;
GRANT INSERT (user_id, nickname, avatar_id, onboarding_completed, updated_at)
  ON TABLE member_profiles TO skill_tree_runtime;
GRANT UPDATE (nickname, avatar_id, onboarding_completed, updated_at) ON TABLE member_profiles TO skill_tree_runtime;
GRANT SELECT (id, user_id, token_hash, expires_at) ON TABLE member_sessions TO skill_tree_runtime;
GRANT INSERT (user_id, token_hash, expires_at) ON TABLE member_sessions TO skill_tree_runtime;
GRANT DELETE ON TABLE member_sessions TO skill_tree_runtime;
GRANT SELECT (id, user_id, token_hash, purpose, created_at, expires_at, used_at, attempt_count) ON TABLE email_tokens TO skill_tree_runtime;
GRANT INSERT (user_id, token_hash, purpose, expires_at) ON TABLE email_tokens TO skill_tree_runtime;
GRANT UPDATE (used_at, attempt_count) ON TABLE email_tokens TO skill_tree_runtime;
GRANT SELECT (id, username, role, password_hash, disabled_at, created_at) ON TABLE admin_accounts TO skill_tree_runtime;
GRANT UPDATE (disabled_at, updated_at) ON TABLE admin_accounts TO skill_tree_runtime;
GRANT SELECT (admin_id, token_hash, expires_at) ON TABLE admin_sessions TO skill_tree_runtime;
GRANT INSERT (admin_id, token_hash, expires_at) ON TABLE admin_sessions TO skill_tree_runtime;
GRANT DELETE ON TABLE admin_sessions TO skill_tree_runtime;
GRANT INSERT (admin_id, action, target_type, target_id, metadata) ON TABLE admin_audit_log TO skill_tree_runtime;
GRANT SELECT (scope, subject_hash, failure_count, first_failure_at, blocked_until, last_sent_at)
  ON TABLE auth_rate_limits TO skill_tree_runtime;
GRANT INSERT (scope, subject_hash, failure_count, first_failure_at, last_sent_at, updated_at)
  ON TABLE auth_rate_limits TO skill_tree_runtime;
GRANT UPDATE (failure_count, first_failure_at, blocked_until, last_sent_at, updated_at)
  ON TABLE auth_rate_limits TO skill_tree_runtime;
GRANT DELETE ON TABLE auth_rate_limits TO skill_tree_runtime;
GRANT SELECT (user_id, provider) ON TABLE member_auth_identities TO skill_tree_runtime;
GRANT SELECT ON TABLE skill_categories, skills, skill_prerequisites TO skill_tree_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE questions TO skill_tree_runtime;
GRANT SELECT ON TABLE quiz_attempts, quiz_attempt_questions, user_skill_completions,
  user_progress_revisions, xp_ledger TO skill_tree_runtime;
GRANT INSERT (
  id, user_id, skill_id, catalog_version, status, total_questions,
  skill_title_snapshot, idempotency_key, idempotency_fingerprint
) ON TABLE quiz_attempts TO skill_tree_runtime;
GRANT UPDATE (status, correct_count, passed, completed_at)
  ON TABLE quiz_attempts TO skill_tree_runtime;
GRANT INSERT (
  attempt_id, question_id, ordinal, prompt_snapshot, choices_snapshot,
  correct_choice_snapshot, explanation_snapshot, answer_mode_snapshot,
  correct_choices_snapshot, choice_explanations_snapshot
) ON TABLE quiz_attempt_questions TO skill_tree_runtime;
GRANT UPDATE (selected_choice, selected_choices, answered_at)
  ON TABLE quiz_attempt_questions TO skill_tree_runtime;
GRANT INSERT (user_id, skill_id, first_passed_attempt_id) ON TABLE user_skill_completions TO skill_tree_runtime;
GRANT INSERT (user_id, revision, updated_at) ON TABLE user_progress_revisions TO skill_tree_runtime;
GRANT UPDATE (revision, updated_at) ON TABLE user_progress_revisions TO skill_tree_runtime;
GRANT SELECT (event_id, user_id, source_type, source_id, event_type, amount, payload), INSERT
  (event_id, user_id, source_type, source_id, event_type, amount, payload)
  ON TABLE xp_outbox TO skill_tree_runtime;
GRANT SELECT ON TABLE user_learning_activity_history TO skill_tree_runtime;
-- The development workbench exposes only migration names/timestamps, never checksums or SQL.
GRANT SELECT (name, applied_at) ON TABLE schema_migrations TO skill_tree_runtime;

-- Identity sequences needed by the runtime. Admin account creation stays on the migration credential.
GRANT USAGE, SELECT ON SEQUENCE users_id_seq, member_sessions_id_seq, email_tokens_id_seq,
  admin_sessions_id_seq, admin_audit_log_id_seq, questions_id_seq TO skill_tree_runtime;

-- Deliberately do not grant schema_migrations checksums, DDL, TRUNCATE, or future tables here.
-- Add explicit grants when a reviewed migration introduces a new runtime data path.
