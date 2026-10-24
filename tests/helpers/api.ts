// Calls the Worker's routes the way the app does, against schema.sql in
// SQLite, at a chosen time.

import assert from "node:assert/strict";
import { handle, type AppEnv } from "../../worker/app.ts";
import { sqliteDb } from "./sqliteDb.ts";

export const APP = "https://couple-money.test";
export const START = new Date("2026-10-20T03:00:00Z"); // 10:00 WIB
export const minutes = (n: number) => new Date(START.getTime() + n * 60_000);

type Options = { body?: unknown; cookie?: string; origin?: string | null; now?: Date };

export function call(env: AppEnv, method: string, path: string, options: Options = {}): Promise<Response> {
  const headers = new Headers();
  if (options.origin !== null) headers.set("origin", options.origin ?? APP);
  if (options.cookie) headers.set("cookie", options.cookie);
  if (options.body !== undefined) headers.set("content-type", "application/json");
  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  return handle(new Request(APP + path, { method, headers, body }), env, options.now ?? START);
}

/** The answer's JSON body. */
export async function body(response: Response): Promise<Record<string, any>> {
  return (await response.json()) as Record<string, any>;
}

export function sessionOf(response: Response): string {
  const cookie = (response.headers.get("set-cookie") ?? "").split(";")[0];
  assert.match(cookie, /^session=.+/, "a session cookie was set");
  return cookie;
}

export async function signUp(env: AppEnv, username: string, passcode = "secret123"): Promise<string> {
  const response = await call(env, "POST", "/api/signup", { body: { username, passcode } });
  assert.equal(response.status, 201, await response.clone().text());
  return sessionOf(response);
}

export function setup() {
  const { db, sqlite } = sqliteDb();
  return { env: { DB: db } as AppEnv, sqlite };
}
