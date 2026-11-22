-- Feature expansion: shares splits done in code; everything else needs storage.
CREATE TABLE email_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_email_codes_email ON email_codes(email);

CREATE TABLE group_invites (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 0,
  uses INTEGER NOT NULL DEFAULT 0,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_group_invites_hash ON group_invites(token_hash);

CREATE TABLE expense_comments (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX idx_expense_comments_expense ON expense_comments(expense_id);

ALTER TABLE group_members ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner','admin','member'));
UPDATE group_members SET role = 'owner'
  WHERE EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.created_by = group_members.user_id);

ALTER TABLE groups ADD COLUMN accent TEXT;
ALTER TABLE groups ADD COLUMN photo_key TEXT;
ALTER TABLE users ADD COLUMN digest_enabled INTEGER NOT NULL DEFAULT 1;
