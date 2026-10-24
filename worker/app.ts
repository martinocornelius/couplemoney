// The Worker's /api routes. index.ts passes requests here; tests call
// handle() directly with a stand-in database and a chosen time.

import { normalizeUsername, passcodeProblem, usernameProblem } from "../shared/accounts.ts";
import { answer, profile, refuse, requireUser, type Profile } from "./access.ts";
import { burnPasscodeCheck, clearSessionCookie, hashPasscode, randomCode, startSession, verifyPasscode } from "./auth.ts";
import type { Db } from "./db.ts";
import { fail, json, readBody, text } from "./http.ts";
import { createHome, findHomeByCode, getHome, joinHome, leaveHome, removeMember, resetHomeCode } from "./homes.ts";
import { TABLES } from "./tables.ts";
import { DAY, MINUTE, minutesUntil, wib, wibAfter } from "./time.ts";

export interface AppEnv {
  /** Missing until the D1 binding is set up in wrangler.jsonc. */
  DB?: Db;
}

const WRONG_LOGIN = "Wrong username or passcode.";
const USERNAME_TAKEN = "That username is taken. Try another one.";
const MAX_WRONG_PASSCODES = 5;
const LOCK_MINUTES = 15;
const ONE_TIME_PASSCODE_LENGTH = 10;

type UserRow = {
  id: string;
  username: string;
  passcode_hash: string;
  passcode_salt: string;
  failed_logins: number;
  locked_until: string | null;
  must_change_passcode: number;
  reset_expires_at: string | null;
  is_admin: number;
  created_at: string;
};

const USER_COLUMNS =
  "id, username, passcode_hash, passcode_salt, failed_logins, locked_until, must_change_passcode, reset_expires_at, is_admin, created_at";

export async function handle(request: Request, env: AppEnv, now = new Date()): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/api/health") {
    return request.method === "GET" ? health(env.DB) : fail(405, "Use GET.");
  }

  const db = env.DB;
  if (!db) return fail(503, "The database isn't connected.");

  // Changes are accepted only from the app's own address (SPEC.md, Security rules).
  if (request.method !== "GET" && request.headers.get("origin") !== url.origin) {
    return fail(403, "Requests must come from the app itself.");
  }

  const route = `${request.method} ${url.pathname}`;
  try {
    switch (route) {
      case "POST /api/signup":
        return await signUp(request, db, now);
      case "POST /api/login":
        return await logIn(request, db, now);
      case "POST /api/logout":
        return await logOut(request, db, now);
      case "GET /api/me":
        return await me(request, db, now);
      case "POST /api/passcode":
        return await changePasscode(request, db, now);
      case "GET /api/admin/account":
        return await findAccount(request, db, now, url);
      case "POST /api/admin/reset":
        return await resetPasscode(request, db, now);
      case "POST /api/homes":
        return await createHome(request, db, now);
      case "GET /api/join":
        return await findHomeByCode(request, db, now, url);
      case "POST /api/join":
        return await joinHome(request, db, now);
      case "GET /api/home":
        return await getHome(request, db, now);
      case "POST /api/home/code":
        return await resetHomeCode(request, db, now);
      case "POST /api/home/remove-member":
        return await removeMember(request, db, now);
      case "POST /api/home/leave":
        return await leaveHome(request, db, now);
      default:
        return fail(404, "Not found.");
    }
  } catch (error) {
    // Only the error itself: request bodies, and so passcodes, are never logged.
    console.error(`${route} failed:`, error instanceof Error ? error.message : error);
    return fail(500, "Something went wrong. Please try again.");
  }
}

// --- Health -----------------------------------------------------------------

/** Says whether the Worker, the database and all ten tables are there. */
async function health(db: Db | undefined): Promise<Response> {
  if (!db) {
    return json({ status: "needs setup", database: "not connected: the DB binding is missing from wrangler.jsonc" }, 503);
  }
  try {
    const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>();
    const found = new Set(results.map((row) => row.name));
    const missing = TABLES.filter((table) => !found.has(table));
    const tables = `${TABLES.length - missing.length} of ${TABLES.length}`;
    if (missing.length > 0) {
      return json({ status: "needs setup", database: "connected", tables, missing, hint: "Run schema.sql in the D1 Console" }, 503);
    }
    return json({ status: "ok", database: "connected", tables });
  } catch (error) {
    console.error("Health check: the database query failed", error);
    return json({ status: "error", database: "not reachable" }, 503);
  }
}

// --- Wrong passcodes -------------------------------------------------------------

function locked(now: Date, lockedUntil: string): Response {
  const minutes = minutesUntil(now, lockedUntil);
  return fail(429, `Too many wrong passcodes. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, "locked");
}

/** Locks the account for 15 minutes; the count of wrong passcodes starts again after that. */
async function lock(db: Db, userId: string, now: Date): Promise<Response> {
  const until = wibAfter(now, LOCK_MINUTES * MINUTE);
  await db.prepare("UPDATE users SET failed_logins = 0, locked_until = ? WHERE id = ?").bind(until, userId).run();
  return locked(now, until);
}

/**
 * Checks a passcode, allowing 5 wrong ones in a row before a 15-minute lock.
 * Each attempt is counted in the database before the passcode is checked, so
 * many attempts sent at the same moment still get only 5 checks between them.
 * Returns "ok", "wrong", or the answer for a locked account.
 */
async function checkPasscode(db: Db, user: UserRow, passcode: string, now: Date): Promise<"ok" | "wrong" | Response> {
  const attempt = await db
    .prepare(
      `UPDATE users SET failed_logins = failed_logins + 1
       WHERE id = ? AND (locked_until IS NULL OR locked_until <= ?)
       RETURNING failed_logins`,
    )
    .bind(user.id, wib(now))
    .first<{ failed_logins: number }>();
  if (!attempt) {
    const row = await db.prepare("SELECT locked_until FROM users WHERE id = ?").bind(user.id).first<{ locked_until: string | null }>();
    return locked(now, row?.locked_until ?? wibAfter(now, LOCK_MINUTES * MINUTE));
  }
  if (attempt.failed_logins > MAX_WRONG_PASSCODES) return lock(db, user.id, now);

  if (await verifyPasscode(passcode, user.passcode_hash, user.passcode_salt)) {
    await db.prepare("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?").bind(user.id).run();
    return "ok";
  }
  return attempt.failed_logins === MAX_WRONG_PASSCODES ? lock(db, user.id, now) : "wrong";
}

// --- Routes ------------------------------------------------------------------------

async function signUp(request: Request, db: Db, now: Date): Promise<Response> {
  const body = await readBody(request);
  const username = normalizeUsername(text(body.username));
  const passcode = text(body.passcode);
  const problem = usernameProblem(username) ?? passcodeProblem(passcode);
  if (problem) return fail(400, problem);

  if (await db.prepare("SELECT 1 FROM users WHERE username = ?").bind(username).first()) {
    return fail(409, USERNAME_TAKEN);
  }
  const { hash, salt } = await hashPasscode(passcode);
  const id = crypto.randomUUID();
  try {
    await db
      .prepare("INSERT INTO users (id, username, passcode_hash, passcode_salt, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(id, username, hash, salt, wib(now))
      .run();
  } catch (error) {
    // Someone else took the name in the moment between the check and the insert.
    if (String(error).includes("UNIQUE")) return fail(409, USERNAME_TAKEN);
    throw error;
  }

  const cookie = await startSession(db, id, now);
  const user: Profile = { username, isAdmin: false, mustChangePasscode: false, home: null };
  return json({ user }, 201, { "set-cookie": cookie });
}

async function logIn(request: Request, db: Db, now: Date): Promise<Response> {
  const body = await readBody(request);
  const username = normalizeUsername(text(body.username));
  const passcode = text(body.passcode);

  const user = await db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE username = ?`).bind(username).first<UserRow>();
  if (!user) {
    await burnPasscodeCheck(passcode);
    return fail(401, WRONG_LOGIN);
  }
  const check = await checkPasscode(db, user, passcode, now);
  if (check instanceof Response) return check;
  if (check === "wrong") return fail(401, WRONG_LOGIN);
  if (user.must_change_passcode === 1 && user.reset_expires_at && user.reset_expires_at <= wib(now)) {
    return fail(401, "This one-time passcode has expired. Ask the app admin for a new one.", "reset_expired");
  }

  const cookie = await startSession(db, user.id, now);
  const me = await profile(db, {
    userId: user.id,
    username: user.username,
    isAdmin: user.is_admin === 1,
    mustChangePasscode: user.must_change_passcode === 1,
  });
  return json({ user: me }, 200, { "set-cookie": cookie });
}

async function logOut(request: Request, db: Db, now: Date): Promise<Response> {
  const user = await requireUser(request, db, now, { allowMustChange: true });
  if (user instanceof Response) return user;
  await db.prepare("DELETE FROM sessions WHERE id = ?").bind(user.sessionId).run();
  return new Response(null, { status: 204, headers: { "set-cookie": clearSessionCookie(), "cache-control": "no-store" } });
}

async function me(request: Request, db: Db, now: Date): Promise<Response> {
  const user = await requireUser(request, db, now, { allowMustChange: true });
  if (user instanceof Response) return user;
  return answer(user, { user: await profile(db, user) });
}

/**
 * Normally needs the current passcode. Right after an admin reset it doesn't:
 * the account just logged in with the one-time passcode.
 * Either way, the account's other devices are logged out.
 */
async function changePasscode(request: Request, db: Db, now: Date): Promise<Response> {
  const user = await requireUser(request, db, now, { allowMustChange: true });
  if (user instanceof Response) return user;

  const body = await readBody(request);
  const newPasscode = text(body.newPasscode);
  const problem = passcodeProblem(newPasscode);
  if (problem) return fail(400, problem);

  if (!user.mustChangePasscode) {
    const row = await db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(user.userId).first<UserRow>();
    if (!row) return fail(401, "You're not logged in.", "not_logged_in");
    const check = await checkPasscode(db, row, text(body.currentPasscode), now);
    if (check instanceof Response) return check;
    if (check === "wrong") return fail(400, "Your current passcode is wrong.");
  }

  const { hash, salt } = await hashPasscode(newPasscode);
  await db.batch([
    db
      .prepare(
        `UPDATE users SET passcode_hash = ?, passcode_salt = ?, must_change_passcode = 0, reset_expires_at = NULL,
         failed_logins = 0, locked_until = NULL WHERE id = ?`,
      )
      .bind(hash, salt, user.userId),
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?").bind(user.userId, user.sessionId),
  ]);
  return answer(user, { user: await profile(db, { ...user, mustChangePasscode: false }) });
}

type AccountRow = Pick<UserRow, "id" | "username" | "created_at" | "locked_until" | "must_change_passcode" | "reset_expires_at">;

/** What the admin may see about an account: never a passcode, never any home's money. */
function accountInfo(row: AccountRow, now: Date) {
  const current = wib(now);
  return {
    username: row.username,
    createdAt: row.created_at,
    lockedUntil: row.locked_until && row.locked_until > current ? row.locked_until : null,
    resetExpiresAt:
      row.must_change_passcode === 1 && row.reset_expires_at && row.reset_expires_at > current ? row.reset_expires_at : null,
  };
}

async function findAccountRow(db: Db, username: string): Promise<AccountRow | null> {
  return db
    .prepare("SELECT id, username, created_at, locked_until, must_change_passcode, reset_expires_at FROM users WHERE username = ?")
    .bind(normalizeUsername(username))
    .first<AccountRow>();
}

async function findAccount(request: Request, db: Db, now: Date, url: URL): Promise<Response> {
  const admin = await requireUser(request, db, now, { adminOnly: true });
  if (admin instanceof Response) return admin;
  const row = await findAccountRow(db, url.searchParams.get("username") ?? "");
  if (!row) return refuse(admin, 404, "No account has that username.");
  return answer(admin, { account: accountInfo(row, now) });
}

/**
 * Gives the account a one-time passcode, valid for 24 hours, shown to the
 * admin only in this answer. It also clears any lock and logs the account
 * out everywhere; its next log in must choose a new passcode.
 */
async function resetPasscode(request: Request, db: Db, now: Date): Promise<Response> {
  const admin = await requireUser(request, db, now, { adminOnly: true });
  if (admin instanceof Response) return admin;
  const body = await readBody(request);
  const row = await findAccountRow(db, text(body.username));
  if (!row) return refuse(admin, 404, "No account has that username.");
  if (row.id === admin.userId) {
    return refuse(admin, 400, "That's your own account. Use Change passcode instead.");
  }

  const oneTimePasscode = randomCode(ONE_TIME_PASSCODE_LENGTH);
  const { hash, salt } = await hashPasscode(oneTimePasscode);
  const expiresAt = wibAfter(now, DAY);
  await db.batch([
    db
      .prepare(
        `UPDATE users SET passcode_hash = ?, passcode_salt = ?, must_change_passcode = 1, reset_expires_at = ?,
         failed_logins = 0, locked_until = NULL WHERE id = ?`,
      )
      .bind(hash, salt, expiresAt, row.id),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.id),
  ]);
  const account = accountInfo({ ...row, locked_until: null, must_change_passcode: 1, reset_expires_at: expiresAt }, now);
  return answer(admin, { oneTimePasscode, expiresAt, account });
}
