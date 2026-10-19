// Runs schema.sql in a throwaway SQLite database (the engine D1 uses) and
// checks that the rules from SPEC.md hold: good rows go in, bad rows are refused.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { TABLES } from "../worker/tables.ts";

const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

/** A database with two homes: h1 (martino and sari) and h2 (budi). */
function freshDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON"); // D1 always enforces foreign keys.
  db.exec(schema);
  db.exec(`
    INSERT INTO users (id, username, passcode_hash, passcode_salt) VALUES
      ('u1', 'martino', 'hash', 'salt'), ('u2', 'sari', 'hash', 'salt'), ('u3', 'budi', 'hash', 'salt');
    INSERT INTO homes (id, name, home_code, created_by) VALUES
      ('h1', 'Our home', 'ABCD2345EFGH', 'u1'), ('h2', 'Other home', 'JKMN6789PQRS', 'u3');
    INSERT INTO members (id, home_id, user_id) VALUES ('m1', 'h1', 'u1'), ('m2', 'h1', 'u2'), ('m3', 'h2', 'u3');
    INSERT INTO pockets (id, home_id, name, type, bank_name, account_number, created_by) VALUES
      ('bca', 'h1', 'BCA joint account', 'bank', 'BCA', '0123456789', 'm1');
    INSERT INTO pockets (id, home_id, name, type, created_by) VALUES
      ('cash', 'h1', 'Cash in wallet', 'cash', 'm1'), ('their-cash', 'h2', 'Their cash', 'cash', 'm3');
    INSERT INTO categories (id, home_id, kind, name, emoji, built_in) VALUES
      ('food', 'h1', 'expense', 'Food and drinks', '🍜', 0),
      ('salary', 'h1', 'income', 'Salary', '💼', 0),
      ('debt-payment', 'h1', 'expense', 'Debt payment', '💳', 1),
      ('their-groceries', 'h2', 'expense', 'Groceries', '🛒', 0);
  `);
  return db;
}

type TransactionRow = {
  home_id: string;
  member_id: string;
  type: string;
  amount: number;
  pocket_id: string;
  to_pocket_id: string | null;
  category_id: string | null;
};

let nextId = 0;

/** Adds a transaction; by default an Rp 25.000 food expense from cash in home h1. */
function addTransaction(db: DatabaseSync, changes: Partial<TransactionRow> = {}): string {
  const id = `t${++nextId}`;
  const row: TransactionRow = {
    home_id: "h1",
    member_id: "m1",
    type: "expense",
    amount: 25000,
    pocket_id: "cash",
    to_pocket_id: null,
    category_id: "food",
    ...changes,
  };
  db.prepare(
    `INSERT INTO transactions (id, home_id, member_id, type, amount, pocket_id, to_pocket_id, category_id)
     VALUES (:id, :home_id, :member_id, :type, :amount, :pocket_id, :to_pocket_id, :category_id)`,
  ).run({ id, ...row });
  return id;
}

test("creates exactly the ten tables the health check looks for", () => {
  const db = freshDb();
  const names = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((row) => String(row.name));
  assert.deepEqual(names, [...TABLES].sort());
});

test("every GLOB pattern fits D1's 50-byte limit", () => {
  // Plain SQLite allows long patterns, but D1 refuses anything over 50 bytes
  // ("LIKE or GLOB pattern too complex"), which would break every insert.
  const patterns = [...schema.matchAll(/GLOB '([^']*)'/g)].map((m) => m[1]);
  assert.ok(patterns.length > 0);
  for (const pattern of patterns) {
    assert.ok(Buffer.byteLength(pattern) <= 50, `${pattern} is ${Buffer.byteLength(pattern)} bytes`);
  }
});

test("still works when pasted as one line, like the D1 Console does", () => {
  // The Console's input box turns line breaks into spaces. A "--" note would
  // then hide everything after it, so notes must be /* ... */ without ";".
  assert.ok(!schema.includes("--"), "no -- notes");
  for (const note of schema.match(/\/\*[\s\S]*?\*\//g) ?? []) {
    assert.ok(!note.includes(";"), `no semicolon in the note ${note.slice(0, 40)}`);
  }
  const db = new DatabaseSync(":memory:");
  db.exec(schema.replace(/\n/g, " "));
  const count = db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table'").get();
  assert.equal(count?.n, TABLES.length);
});

test("times must look like 2026-10-16T09:30", () => {
  const db = freshDb();
  const add = (when: string) => () =>
    db
      .prepare(
        `INSERT INTO transactions (id, home_id, member_id, type, amount, pocket_id, category_id, occurred_at)
         VALUES (:id, 'h1', 'm1', 'expense', 25000, 'cash', 'food', :when)`,
      )
      .run({ id: `at-${when}`, when });
  assert.doesNotThrow(add("2026-10-16T09:30"));
  assert.doesNotThrow(add("2026-10-16T09:30:15"));
  assert.throws(add("16-10-2026 09:30"), /CHECK/);
  assert.throws(add("2026-10-16 09:30"), /CHECK/);
  assert.throws(add("2026-10-16"), /CHECK/);
});

test("running the schema a second time is safe", () => {
  const db = freshDb();
  assert.doesNotThrow(() => db.exec(schema));
});

test("bank rule: a bank pocket needs a bank name and 5 to 20 digits", () => {
  const db = freshDb();
  const add = (sql: string) => () => db.exec(`INSERT INTO pockets (id, home_id, name, type, bank_name, account_number, created_by) VALUES ${sql}`);
  assert.throws(add("('x1', 'h1', 'BCA', 'bank', 'BCA', NULL, 'm1')"), /CHECK/, "no account number");
  assert.throws(add("('x2', 'h1', 'BCA', 'bank', NULL, '0123456789', 'm1')"), /CHECK/, "no bank name");
  assert.throws(add("('x3', 'h1', 'BCA', 'bank', 'BCA', '01234AB789', 'm1')"), /CHECK/, "letters in the account number");
  assert.throws(add("('x4', 'h1', 'BCA', 'bank', 'BCA', '1234', 'm1')"), /CHECK/, "only 4 digits");
  assert.throws(add("('x5', 'h1', 'BCA', 'bank', 'BCA', '123456789012345678901', 'm1')"), /CHECK/, "21 digits");
  assert.doesNotThrow(add("('x6', 'h1', 'Mandiri', 'bank', 'Mandiri', '00012', 'm1')"), "leading zeros are kept");
});

test("bank rule: other pockets never have bank details", () => {
  const db = freshDb();
  const add = (sql: string) => () => db.exec(`INSERT INTO pockets (id, home_id, name, type, bank_name, account_number, created_by) VALUES ${sql}`);
  assert.throws(add("('y1', 'h1', 'Cash', 'cash', NULL, '0123456789', 'm1')"), /CHECK/);
  assert.throws(add("('y2', 'h1', 'GoPay', 'e_wallet', 'BCA', NULL, 'm1')"), /CHECK/);
  assert.doesNotThrow(add("('y3', 'h1', 'GoPay', 'e_wallet', NULL, NULL, 'm1')"));
});

test("a goal date needs a goal amount", () => {
  const db = freshDb();
  const add = (sql: string) => () => db.exec(`INSERT INTO pockets (id, home_id, name, type, goal_amount, goal_date, created_by) VALUES ${sql}`);
  assert.throws(add("('g1', 'h1', 'Bali trip', 'other', NULL, '2027-12-31', 'm1')"), /CHECK/);
  assert.doesNotThrow(add("('g2', 'h1', 'Bali trip', 'other', 20000000, '2027-12-31', 'm1')"));
});

test("type rules: good income, expense, transfer and adjustment go in", () => {
  const db = freshDb();
  assert.doesNotThrow(() => addTransaction(db));
  assert.doesNotThrow(() => addTransaction(db, { type: "income", amount: 7500000, pocket_id: "bca", category_id: "salary" }));
  assert.doesNotThrow(() => addTransaction(db, { type: "transfer", amount: 500000, pocket_id: "bca", to_pocket_id: "cash", category_id: null }));
  assert.doesNotThrow(() => addTransaction(db, { type: "adjustment", amount: -350000, category_id: null }));
  assert.doesNotThrow(() => addTransaction(db, { type: "adjustment", amount: 50000, category_id: null }));
});

test("type rules: income and expense need a positive amount and a category", () => {
  const db = freshDb();
  assert.throws(() => addTransaction(db, { category_id: null }), /CHECK/);
  assert.throws(() => addTransaction(db, { amount: -25000 }), /CHECK/);
  assert.throws(() => addTransaction(db, { amount: 0 }), /CHECK/);
  assert.throws(() => addTransaction(db, { to_pocket_id: "bca" }), /CHECK/);
});

test("type rules: the category must match income or expense", () => {
  const db = freshDb();
  assert.throws(() => addTransaction(db, { type: "income", category_id: "food" }), /FOREIGN KEY/);
  assert.throws(() => addTransaction(db, { type: "expense", category_id: "salary" }), /FOREIGN KEY/);
});

test("type rules: a transfer goes to a different pocket and has no category", () => {
  const db = freshDb();
  const transfer = { type: "transfer", pocket_id: "bca", category_id: null };
  assert.throws(() => addTransaction(db, { ...transfer, to_pocket_id: null }), /CHECK/);
  assert.throws(() => addTransaction(db, { ...transfer, to_pocket_id: "bca" }), /CHECK/);
  assert.throws(() => addTransaction(db, { ...transfer, to_pocket_id: "cash", category_id: "food" }), /CHECK/);
  assert.throws(() => addTransaction(db, { ...transfer, to_pocket_id: "cash", amount: -1000 }), /CHECK/);
});

test("type rules: an adjustment is never 0 and has no category", () => {
  const db = freshDb();
  assert.throws(() => addTransaction(db, { type: "adjustment", amount: 0, category_id: null }), /CHECK/);
  assert.throws(() => addTransaction(db, { type: "adjustment", amount: -5000 }), /CHECK/);
});

test("amounts are whole rupiah: decimals are refused", () => {
  const db = freshDb();
  assert.throws(() => addTransaction(db, { amount: 2500.5 }), /REAL|INTEGER/);
});

test("home boundaries: pockets, categories and members from another home are refused", () => {
  const db = freshDb();
  assert.throws(() => addTransaction(db, { pocket_id: "their-cash" }), /FOREIGN KEY/);
  assert.throws(() => addTransaction(db, { category_id: "their-groceries" }), /FOREIGN KEY/);
  assert.throws(() => addTransaction(db, { member_id: "m3" }), /FOREIGN KEY/);
  assert.throws(
    () => addTransaction(db, { type: "transfer", pocket_id: "bca", to_pocket_id: "their-cash", category_id: null }),
    /FOREIGN KEY/,
  );
});

test("usernames are 3 to 20 lowercase letters, numbers, dots or underscores", () => {
  const db = freshDb();
  const add = (name: string) => () =>
    db.prepare("INSERT INTO users (id, username, passcode_hash, passcode_salt) VALUES (:id, :name, 'h', 's')").run({ id: `id-${name}`, name });
  assert.throws(add("Martino2"), /CHECK/);
  assert.throws(add("ab"), /CHECK/);
  assert.throws(add("sari@home"), /CHECK/);
  assert.throws(add("martino"), /UNIQUE/);
  assert.doesNotThrow(add("test.sari_2"));
});

test("an account is an active member of only one home", () => {
  const db = freshDb();
  assert.throws(() => db.exec("INSERT INTO members (id, home_id, user_id) VALUES ('m9', 'h2', 'u1')"), /UNIQUE/);
  db.exec("UPDATE members SET removed_at = '2026-10-18T10:00' WHERE id = 'm1'");
  assert.doesNotThrow(() => db.exec("INSERT INTO members (id, home_id, user_id) VALUES ('m9', 'h2', 'u1')"));
});

test("home codes are 12 characters without 0, 1, I or O", () => {
  const db = freshDb();
  const add = (code: string) => () =>
    db.prepare("INSERT INTO homes (id, name, home_code, created_by) VALUES (:id, 'Test', :code, 'u1')").run({ id: `home-${code}`, code });
  assert.throws(add("ABCD2345EFGO"), /CHECK/);
  assert.throws(add("ABCD2345EFG0"), /CHECK/);
  assert.throws(add("ABCD2345EFGI"), /CHECK/);
  assert.throws(add("ABCD2345EF1H"), /CHECK/);
  assert.throws(add("ABCD2345EFG"), /CHECK/);
  assert.doesNotThrow(add("WXYZ2345KLMN"));
});

test("categories: names are unique per home and kind, built-in ones can't be hidden", () => {
  const db = freshDb();
  assert.throws(() => db.exec("INSERT INTO categories (id, home_id, kind, name, emoji) VALUES ('dup', 'h1', 'expense', 'food and DRINKS', '🍔')"), /UNIQUE/);
  assert.doesNotThrow(() => db.exec("INSERT INTO categories (id, home_id, kind, name, emoji) VALUES ('ok', 'h1', 'income', 'Food and drinks', '🍔')"));
  assert.throws(() => db.exec("UPDATE categories SET hidden = 1 WHERE id = 'debt-payment'"), /CHECK/);
  assert.doesNotThrow(() => db.exec("UPDATE categories SET hidden = 1 WHERE id = 'food'"));
});

test("a used category can't be deleted", () => {
  const db = freshDb();
  addTransaction(db);
  assert.throws(() => db.exec("DELETE FROM categories WHERE id = 'food'"), /FOREIGN KEY/);
});

test("a paid payable records which transaction paid it", () => {
  const db = freshDb();
  const add = (values: string) => () =>
    db.exec(`INSERT INTO payables_receivables (id, home_id, kind, counterparty, amount, due_date, status, paid_at, transaction_id, created_by) VALUES ${values}`);
  assert.throws(add("('pr1', 'h1', 'payable', 'Budi', 100000, '2026-11-25', 'paid', NULL, NULL, 'm1')"), /CHECK/);
  const paidWith = addTransaction(db, { category_id: "debt-payment", amount: 100000 });
  assert.doesNotThrow(add(`('pr2', 'h1', 'payable', 'Budi', 100000, '2026-11-25', 'paid', '2026-10-18T10:00', '${paidWith}', 'm1')`));
  assert.doesNotThrow(add("('pr3', 'h1', 'receivable', 'Rina', 50000, '2026-11-01', 'open', NULL, NULL, 'm2')"));
});

test("budgets: one per category, only for the home's own categories", () => {
  const db = freshDb();
  const add = (id: string, category: string) => () =>
    db.prepare("INSERT INTO budgets (id, home_id, category_id, monthly_limit, created_by) VALUES (:id, 'h1', :category, 1000000, 'm1')").run({ id, category });
  assert.doesNotThrow(add("b1", "food"));
  assert.throws(add("b2", "food"), /UNIQUE/);
  assert.throws(add("b3", "their-groceries"), /FOREIGN KEY/);
});

test("deleting a recurring rule keeps the entries it recorded", () => {
  const db = freshDb();
  db.exec(`INSERT INTO recurring_rules (id, home_id, member_id, type, amount, pocket_id, category_id, day_of_month, next_date)
           VALUES ('rent', 'h1', 'm1', 'expense', 4500000, 'bca', 'food', 1, '2026-11-01')`);
  const entry = addTransaction(db);
  db.exec(`UPDATE transactions SET recurring_rule_id = 'rent' WHERE id = '${entry}'`);
  db.exec("DELETE FROM recurring_rules WHERE id = 'rent'");
  const row = db.prepare("SELECT recurring_rule_id FROM transactions WHERE id = ?").get(entry);
  assert.equal(row?.recurring_rule_id, null);
});

test("dates default to Western Indonesia Time in ISO format", () => {
  const db = freshDb();
  const id = addTransaction(db);
  const row = db.prepare("SELECT occurred_at, created_at FROM transactions WHERE id = ?").get(id);
  assert.match(String(row?.occurred_at), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.match(String(row?.created_at), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  const wib = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 13); // to the hour
  assert.equal(String(row?.created_at).slice(0, 13), wib);
});
