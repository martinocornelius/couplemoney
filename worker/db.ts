// The small part of the D1 database API the Worker uses. Cloudflare's D1
// fits it, and so does the SQLite stand-in the tests use.

export interface DbStatement {
  bind(...values: unknown[]): DbStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface Db {
  prepare(query: string): DbStatement;
  /** Runs the statements in one transaction: all of them happen, or none. */
  batch(statements: DbStatement[]): Promise<unknown[]>;
}
