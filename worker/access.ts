// Who is asking: the logged-in account, and for home routes, its home.
// Every route except sign up, log in and health starts here (SPEC.md,
// Security rules: "Every request checked").

import { clearSessionCookie, findSession, type SessionUser } from "./auth.ts";
import type { Db } from "./db.ts";
import { fail, json } from "./http.ts";

/**
 * The logged-in account, or the answer to send instead: not logged in, a new
 * passcode is needed first (after an admin reset), or admin only.
 */
export async function requireUser(
  request: Request,
  db: Db,
  now: Date,
  options: { allowMustChange?: boolean; adminOnly?: boolean } = {},
): Promise<SessionUser | Response> {
  const user = await findSession(db, request, now);
  if (!user) return fail(401, "You're not logged in.", "not_logged_in", { "set-cookie": clearSessionCookie() });
  if (user.mustChangePasscode && !options.allowMustChange) {
    return fail(403, "Choose a new passcode first.", "passcode_change_required");
  }
  if (options.adminOnly && !user.isAdmin) return fail(403, "Only the app admin can do this.", "admin_only");
  return user;
}

export type Member = SessionUser & {
  /** This account's row in members: who logged an entry points here. */
  memberId: string;
  homeId: string;
};

/**
 * The logged-in account and the home it's an active member of. Home routes use
 * only this homeId, so every query stays inside the caller's home.
 */
export async function requireMember(request: Request, db: Db, now: Date): Promise<Member | Response> {
  const user = await requireUser(request, db, now);
  if (user instanceof Response) return user;
  const row = await db
    .prepare("SELECT id, home_id FROM members WHERE user_id = ? AND removed_at IS NULL")
    .bind(user.userId)
    .first<{ id: string; home_id: string }>();
  if (!row) return refuse(user, 403, "You're not in a home.", "no_home");
  return { ...user, memberId: row.id, homeId: row.home_id };
}

/** A JSON answer for a logged-in account, carrying the session cookie when it was just extended. */
export function answer(user: SessionUser, body: unknown, status = 200): Response {
  return json(body, status, user.refreshedCookie ? { "set-cookie": user.refreshedCookie } : {});
}

/** An error answer for a logged-in account: a sentence the app can show as it is. */
export function refuse(user: SessionUser, status: number, error: string, code?: string): Response {
  return answer(user, code ? { error, code } : { error }, status);
}

export type Profile = {
  username: string;
  isAdmin: boolean;
  mustChangePasscode: boolean;
  home: { id: string; name: string } | null;
};

/** What the app needs to know about the logged-in account. Never includes passcode data. */
export async function profile(
  db: Db,
  user: { userId: string; username: string; isAdmin: boolean; mustChangePasscode: boolean },
): Promise<Profile> {
  const home = await db
    .prepare(
      `SELECT h.id, h.name FROM members m JOIN homes h ON h.id = m.home_id
       WHERE m.user_id = ? AND m.removed_at IS NULL`,
    )
    .bind(user.userId)
    .first<{ id: string; name: string }>();
  return { username: user.username, isAdmin: user.isAdmin, mustChangePasscode: user.mustChangePasscode, home: home ?? null };
}
