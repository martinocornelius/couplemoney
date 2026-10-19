/*
   Couple Money database (Cloudflare D1): the ten tables from the Data model
   section of SPEC.md, their rules, and the indexes the app's queries need.

   How to run it: Cloudflare dashboard → Storage & databases → D1 SQL database
   → couple-money-db → Console. Paste this whole file and click Execute.
   Running it again is safe: anything that already exists is left alone.

   The Console turns the pasted text into one long line, so every note in this
   file is written between slash-star and star-slash, and notes never contain
   a semicolon. A double-dash note would hide everything after it.

   Conventions
     * Ids are random text. Money is whole rupiah (INTEGER). "Empty" is NULL.
     * Dates are text in Western Indonesia Time (WIB), like 2026-10-16T09:30.
     * STRICT tables refuse wrong types, so an amount like 2500.5 is rejected.
     * Pairs like (home_id, pocket_id) point at (home_id, id) in the other
       table, so the database itself refuses a pocket, category or member
       from another home.
     * The app sets updated_at whenever it changes a row.
     * D1 refuses GLOB patterns longer than 50 bytes, so every pattern here is shorter.
*/

/* Accounts */

CREATE TABLE IF NOT EXISTS users (
  id                   TEXT PRIMARY KEY,
  /* 3 to 20 characters: lowercase letters, numbers, dot or underscore. */
  username             TEXT NOT NULL UNIQUE
                       CHECK (length(username) BETWEEN 3 AND 20
                              AND username NOT GLOB '*[^a-z0-9._]*'),
  /* PBKDF2-SHA256 hash and its salt, the passcode itself is never stored. */
  passcode_hash        TEXT NOT NULL,
  passcode_salt        TEXT NOT NULL,
  must_change_passcode INTEGER NOT NULL DEFAULT 0 CHECK (must_change_passcode IN (0, 1)),
  reset_expires_at     TEXT,
  failed_logins        INTEGER NOT NULL DEFAULT 0 CHECK (failed_logins >= 0),
  locked_until         TEXT,
  /* Only ever set by hand in the D1 Console. */
  is_admin             INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours'))
) STRICT;

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  /* SHA-256 hash of the cookie's token, the token itself is never stored. */
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours'))
) STRICT;

/* Log out everywhere (passcode change, admin reset). */
CREATE INDEX IF NOT EXISTS sessions_by_user ON sessions (user_id);

/* Homes and members */

CREATE TABLE IF NOT EXISTS homes (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL CHECK (trim(name) <> '' AND length(name) <= 50),
  /* 12 characters, stored without dashes (shown as XXXX-XXXX-XXXX). */
  /* Capital letters and digits without the look-alikes 0, 1, I and O. */
  home_code  TEXT NOT NULL UNIQUE
             CHECK (length(home_code) = 12 AND home_code NOT GLOB '*[^A-HJ-NP-Z2-9]*'),
  created_by TEXT NOT NULL REFERENCES users (id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours'))
) STRICT;

CREATE TABLE IF NOT EXISTS members (
  id         TEXT PRIMARY KEY,
  home_id    TEXT NOT NULL REFERENCES homes (id),
  user_id    TEXT NOT NULL REFERENCES users (id),
  removed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  UNIQUE (home_id, id)
) STRICT;

/* An account is an active member of at most one home. */
CREATE UNIQUE INDEX IF NOT EXISTS members_one_active_home ON members (user_id) WHERE removed_at IS NULL;

/* Pockets and categories */

CREATE TABLE IF NOT EXISTS pockets (
  id              TEXT PRIMARY KEY,
  home_id         TEXT NOT NULL REFERENCES homes (id),
  name            TEXT NOT NULL CHECK (trim(name) <> '' AND length(name) <= 50),
  type            TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'e_wallet', 'other')),
  bank_name       TEXT,
  account_number  TEXT,
  opening_balance INTEGER NOT NULL DEFAULT 0,
  goal_amount     INTEGER CHECK (goal_amount IS NULL OR goal_amount > 0),
  goal_date       TEXT CHECK (goal_date IS NULL OR goal_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  archived        INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  UNIQUE (home_id, id),
  FOREIGN KEY (home_id, created_by) REFERENCES members (home_id, id),
  /* The bank rule: a bank pocket needs a bank name and an account number of */
  /* 5 to 20 digits, every other type has neither. */
  CHECK (
    (type = 'bank'
      AND bank_name IS NOT NULL AND trim(bank_name) <> '' AND length(bank_name) <= 50
      AND account_number IS NOT NULL AND length(account_number) BETWEEN 5 AND 20
      AND account_number NOT GLOB '*[^0-9]*')
    OR (type <> 'bank' AND bank_name IS NULL AND account_number IS NULL)
  ),
  /* A target date only makes sense with a target amount. */
  CHECK (goal_date IS NULL OR goal_amount IS NOT NULL)
) STRICT;

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,
  home_id    TEXT NOT NULL REFERENCES homes (id),
  kind       TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  /* Unique within a home and kind, ignoring capitals ("Food" = "food"). */
  name       TEXT NOT NULL COLLATE NOCASE CHECK (trim(name) <> '' AND length(name) <= 30),
  emoji      TEXT NOT NULL CHECK (emoji <> '' AND length(emoji) <= 16),
  built_in   INTEGER NOT NULL DEFAULT 0 CHECK (built_in IN (0, 1)),
  hidden     INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  /* Empty for the default list a new home starts with. */
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  UNIQUE (home_id, kind, name),
  UNIQUE (home_id, id),
  UNIQUE (home_id, id, kind),
  FOREIGN KEY (home_id, created_by) REFERENCES members (home_id, id),
  /* Built-in categories can never be hidden. */
  CHECK (NOT (built_in = 1 AND hidden = 1))
) STRICT;

/* Money moving */

CREATE TABLE IF NOT EXISTS recurring_rules (
  id           TEXT PRIMARY KEY,
  home_id      TEXT NOT NULL REFERENCES homes (id),
  member_id    TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount       INTEGER NOT NULL CHECK (amount > 0),
  pocket_id    TEXT NOT NULL,
  to_pocket_id TEXT,
  category_id  TEXT,
  note         TEXT CHECK (note IS NULL OR length(note) <= 140),
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  next_date    TEXT NOT NULL CHECK (next_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  paused       INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0, 1)),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  FOREIGN KEY (home_id, member_id) REFERENCES members (home_id, id),
  FOREIGN KEY (home_id, pocket_id) REFERENCES pockets (home_id, id),
  FOREIGN KEY (home_id, to_pocket_id) REFERENCES pockets (home_id, id),
  /* Same home, and an income category for income, expense for expense. */
  FOREIGN KEY (home_id, category_id, type) REFERENCES categories (home_id, id, kind),
  CHECK (
    (type IN ('income', 'expense') AND category_id IS NOT NULL AND to_pocket_id IS NULL)
    OR (type = 'transfer' AND category_id IS NULL
        AND to_pocket_id IS NOT NULL AND to_pocket_id <> pocket_id)
  )
) STRICT;

/* The daily scheduled job looks up the active rules that are due. */
CREATE INDEX IF NOT EXISTS recurring_rules_due ON recurring_rules (next_date) WHERE paused = 0;

CREATE TABLE IF NOT EXISTS transactions (
  id                TEXT PRIMARY KEY,
  home_id           TEXT NOT NULL REFERENCES homes (id),
  member_id         TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
  amount            INTEGER NOT NULL,
  pocket_id         TEXT NOT NULL,
  to_pocket_id      TEXT,
  category_id       TEXT,
  note              TEXT CHECK (note IS NULL OR length(note) <= 140),
  /* Two short patterns, because D1 refuses GLOB patterns over 50 bytes. */
  occurred_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M', 'now', '+7 hours'))
                    CHECK (substr(occurred_at, 1, 10) GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'
                           AND substr(occurred_at, 11, 6) GLOB 'T[0-2][0-9]:[0-5][0-9]'),
  /* Entries a rule recorded stay when the rule is deleted. */
  recurring_rule_id TEXT REFERENCES recurring_rules (id) ON DELETE SET NULL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  UNIQUE (home_id, id),
  FOREIGN KEY (home_id, member_id) REFERENCES members (home_id, id),
  FOREIGN KEY (home_id, pocket_id) REFERENCES pockets (home_id, id),
  FOREIGN KEY (home_id, to_pocket_id) REFERENCES pockets (home_id, id),
  /* Same home, and an income category for income, expense for expense. */
  FOREIGN KEY (home_id, category_id, type) REFERENCES categories (home_id, id, kind),
  /* The transaction type rules: */
  /*   income and expense: a positive amount, a category, no To pocket, */
  /*   transfer: a positive amount, a different To pocket, no category, */
  /*   adjustment: any amount except 0, no category, no To pocket. */
  CHECK (
    (type IN ('income', 'expense') AND amount > 0
      AND category_id IS NOT NULL AND to_pocket_id IS NULL)
    OR (type = 'transfer' AND amount > 0
      AND category_id IS NULL AND to_pocket_id IS NOT NULL AND to_pocket_id <> pocket_id)
    OR (type = 'adjustment' AND amount <> 0
      AND category_id IS NULL AND to_pocket_id IS NULL)
  )
) STRICT;

/* Feed, Today / This month totals and the monthly summary. */
CREATE INDEX IF NOT EXISTS transactions_by_time ON transactions (home_id, occurred_at);
/* Pocket balances. */
CREATE INDEX IF NOT EXISTS transactions_by_pocket ON transactions (pocket_id);
CREATE INDEX IF NOT EXISTS transactions_by_to_pocket ON transactions (to_pocket_id) WHERE to_pocket_id IS NOT NULL;
/* Budgets, charts and insights per category. */
CREATE INDEX IF NOT EXISTS transactions_by_category ON transactions (home_id, category_id, occurred_at) WHERE category_id IS NOT NULL;
/* Live updates: what changed since the last check. */
CREATE INDEX IF NOT EXISTS transactions_by_change ON transactions (home_id, updated_at);
/* Entries recorded by a recurring rule. */
CREATE INDEX IF NOT EXISTS transactions_by_rule ON transactions (recurring_rule_id) WHERE recurring_rule_id IS NOT NULL;

/* Planning */

CREATE TABLE IF NOT EXISTS payables_receivables (
  id             TEXT PRIMARY KEY,
  home_id        TEXT NOT NULL REFERENCES homes (id),
  kind           TEXT NOT NULL CHECK (kind IN ('payable', 'receivable')),
  counterparty   TEXT NOT NULL CHECK (trim(counterparty) <> '' AND length(counterparty) <= 50),
  amount         INTEGER NOT NULL CHECK (amount > 0),
  due_date       TEXT NOT NULL CHECK (due_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid')),
  note           TEXT CHECK (note IS NULL OR length(note) <= 140),
  paid_at        TEXT,
  transaction_id TEXT,
  created_by     TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  FOREIGN KEY (home_id, transaction_id) REFERENCES transactions (home_id, id),
  FOREIGN KEY (home_id, created_by) REFERENCES members (home_id, id),
  /* A paid item says when and which transaction recorded it, an open one has neither. */
  CHECK (
    (status = 'open' AND paid_at IS NULL AND transaction_id IS NULL)
    OR (status = 'paid' AND paid_at IS NOT NULL AND transaction_id IS NOT NULL)
  )
) STRICT;

/* Open items by date, and what's due in the next 7 days. */
CREATE INDEX IF NOT EXISTS payables_receivables_by_due ON payables_receivables (home_id, status, due_date);

CREATE TABLE IF NOT EXISTS budgets (
  id            TEXT PRIMARY KEY,
  home_id       TEXT NOT NULL REFERENCES homes (id),
  category_id   TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL CHECK (monthly_limit > 0),
  created_by    TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', '+7 hours')),
  /* One budget per category. */
  UNIQUE (home_id, category_id),
  FOREIGN KEY (home_id, category_id) REFERENCES categories (home_id, id),
  FOREIGN KEY (home_id, created_by) REFERENCES members (home_id, id)
) STRICT;
