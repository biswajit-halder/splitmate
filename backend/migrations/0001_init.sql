-- SplitMate initial schema: 11 tables
-- Money is stored as INTEGER paise (1 INR = 100 paise). No floating point.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_bg TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  icon_bg TEXT,
  icon_color TEXT,
  type TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  user_id TEXT REFERENCES users(id),
  email TEXT,
  status TEXT CHECK(status IN ('active','pending')) DEFAULT 'active',
  joined_at TEXT
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  paid_by TEXT NOT NULL REFERENCES users(id),
  amount_paise INTEGER NOT NULL CHECK(amount_paise >= 0),
  currency TEXT DEFAULT 'INR',
  description TEXT NOT NULL,
  category TEXT,
  split_mode TEXT CHECK(split_mode IN ('equally','exact','percent')),
  expense_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE expense_splits (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount_paise INTEGER NOT NULL,
  weight INTEGER,
  settled INTEGER DEFAULT 0
);

CREATE TABLE balances (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id),
  counterpart_id TEXT NOT NULL REFERENCES users(id),
  net_amount_paise INTEGER NOT NULL,
  updated_at TEXT,
  UNIQUE(group_id, user_id, counterpart_id)
);

CREATE TABLE settlements (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  payer_id TEXT NOT NULL REFERENCES users(id),
  payee_id TEXT NOT NULL REFERENCES users(id),
  amount_paise INTEGER NOT NULL,
  method TEXT,
  status TEXT CHECK(status IN ('pending','completed')) DEFAULT 'pending',
  payer_confirmed INTEGER DEFAULT 0,
  payee_confirmed INTEGER DEFAULT 0,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE friend_requests (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id),
  addressee_id TEXT NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('pending','accepted','rejected')) DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  UNIQUE(requester_id, addressee_id)
);

CREATE TABLE activity_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('expense_added','expense_edited','settlement_made','settlement_received','group_created','group_joined','friend_added','friend_request')),
  group_id TEXT REFERENCES groups(id),
  payload TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  ref_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE spending_summary_monthly (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  month TEXT NOT NULL,
  total_paise INTEGER NOT NULL DEFAULT 0,
  settled_paise INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT,
  UNIQUE(user_id, month)
);
