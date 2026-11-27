ALTER TABLE admin_accounts
  ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'editor',
  ADD CONSTRAINT admin_accounts_role_allowed CHECK (role IN ('owner', 'editor'));

CREATE UNIQUE INDEX admin_accounts_single_active_owner_unique
  ON admin_accounts (role)
  WHERE role = 'owner' AND disabled_at IS NULL;
