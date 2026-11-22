-- Session invalidation, password resets, per-group currency, soft deletes.
ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_password_resets_hash ON password_resets(token_hash);
CREATE INDEX idx_password_resets_user ON password_resets(user_id);

ALTER TABLE groups ADD COLUMN currency TEXT DEFAULT 'INR';
ALTER TABLE expenses ADD COLUMN deleted_at TEXT;
