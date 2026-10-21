// A stand-in for Cloudflare D1 that runs schema.sql in an in-memory SQLite
// database, so the Worker's routes can be tested without Cloudflare.

import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { Db, DbStatement } from "../../worker/db.ts";

const schema = readFileSync(new URL("../../schema.sql", import.meta.url), "utf8");

export function sqliteDb(): { db: Db; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON"); // D1 always enforces foreign keys.
  sqlite.exec(schema);

  const statement = (query: string, values: SQLInputValue[] = []): DbStatement & { runSync(): void } => ({
    bind: (...next: unknown[]) => statement(query, next as SQLInputValue[]),
    first: async <T>() => (sqlite.prepare(query).get(...values) as T | undefined) ?? null,
    all: async <T>() => ({ results: sqlite.prepare(query).all(...values) as T[] }),
    run: async () => sqlite.prepare(query).run(...values),
    runSync: () => void sqlite.prepare(query).run(...values),
  });

  const db: Db = {
    prepare: (query) => statement(query),
    batch: async (statements) => {
      sqlite.exec("BEGIN");
      try {
        for (const s of statements) (s as ReturnType<typeof statement>).runSync();
        sqlite.exec("COMMIT");
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
      return [];
    },
  };
  return { db, sqlite };
}
