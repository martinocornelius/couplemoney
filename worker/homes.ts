// Homes: create one, find one by its code, join it, and the Home settings
// routes (SPEC.md, screens 4, 5 and 12, and Security rules). Home settings
// routes use only the caller's own homeId from requireMember, so every query
// stays inside the caller's home.

import { DEFAULT_CATEGORIES } from "../shared/categories.ts";
import { HOME_CODE_LENGTH, homeNameProblem, normalizeHomeCode } from "../shared/homes.ts";
import { answer, profile, refuse, requireMember, requireUser, type Member } from "./access.ts";
import { randomCode } from "./auth.ts";
import type { Db } from "./db.ts";
import { readBody, text } from "./http.ts";
import { wib } from "./time.ts";

const CODE_NOT_WORKING = "This home code doesn't work. It may have been reset: ask for a new invite link.";
const ALREADY_IN_A_HOME = "You're already in a home. To join or create another, leave it first in Home settings.";

async function isInAHome(db: Db, userId: string): Promise<boolean> {
  return (await db.prepare("SELECT 1 FROM members WHERE user_id = ? AND removed_at IS NULL").bind(userId).first()) !== null;
}

/** The home with this code, typed in any form ("abcd-efgh-jklm" works too), or null. */
async function findHome(db: Db, input: string): Promise<{ id: string; name: string } | null> {
  const code = normalizeHomeCode(input);
  if (!code) return null;
  return db.prepare("SELECT id, name FROM homes WHERE home_code = ?").bind(code).first<{ id: string; name: string }>();
}

type MemberRow = { id: string; username: string; created_at: string };

async function activeMembers(db: Db, homeId: string): Promise<MemberRow[]> {
  const { results } = await db
    .prepare(
      `SELECT m.id, u.username, m.created_at FROM members m JOIN users u ON u.id = m.user_id
       WHERE m.home_id = ? AND m.removed_at IS NULL ORDER BY m.created_at, u.username`,
    )
    .bind(homeId)
    .all<MemberRow>();
  return results;
}

/** What Home settings shows. The code is sent without dashes; the app adds them. */
async function homeSettings(db: Db, member: Member) {
  const home = await db
    .prepare("SELECT id, name, home_code FROM homes WHERE id = ?")
    .bind(member.homeId)
    .first<{ id: string; name: string; home_code: string }>();
  if (!home) throw new Error("A member's home is missing");
  const members = await activeMembers(db, member.homeId);
  return {
    id: home.id,
    name: home.name,
    code: home.home_code,
    members: members.map((row) => ({ id: row.id, username: row.username, joinedAt: row.created_at, you: row.id === member.memberId })),
  };
}

/** Creates a home with the default categories, and the account as its first member. */
export async function createHome(request: Request, db: Db, now: Date): Promise<Response> {
  const user = await requireUser(request, db, now);
  if (user instanceof Response) return user;
  const body = await readBody(request);
  const name = text(body.name).trim();
  const problem = homeNameProblem(name);
  if (problem) return refuse(user, 400, problem);
  if (await isInAHome(db, user.userId)) return refuse(user, 409, ALREADY_IN_A_HOME, "in_home");

  const homeId = crypto.randomUUID();
  const created = wib(now);
  try {
    // All or nothing: the home, its first member and its categories.
    await db.batch([
      db
        .prepare("INSERT INTO homes (id, name, home_code, created_by, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(homeId, name, randomCode(HOME_CODE_LENGTH), user.userId, created),
      db
        .prepare("INSERT INTO members (id, home_id, user_id, created_at) VALUES (?, ?, ?, ?)")
        .bind(crypto.randomUUID(), homeId, user.userId, created),
      // One statement per category: D1 allows at most 100 values in one statement.
      ...DEFAULT_CATEGORIES.map((category, index) =>
        db
          .prepare(
            `INSERT INTO categories (id, home_id, kind, name, emoji, built_in, sort_order, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(crypto.randomUUID(), homeId, category.kind, category.name, category.emoji, category.builtIn ? 1 : 0, index, created),
      ),
    ]);
  } catch (error) {
    // Two taps at the same moment: the database allows only one active home per account.
    if (String(error).includes("UNIQUE")) return refuse(user, 409, ALREADY_IN_A_HOME, "in_home");
    throw error;
  }
  return answer(user, { user: await profile(db, user) }, 201);
}

/** The Join a home screen: the home's name and its members, for whoever has the current code. */
export async function findHomeByCode(request: Request, db: Db, now: Date, url: URL): Promise<Response> {
  const user = await requireUser(request, db, now);
  if (user instanceof Response) return user;
  const home = await findHome(db, url.searchParams.get("code") ?? "");
  if (!home) return refuse(user, 404, CODE_NOT_WORKING, "bad_code");
  const members = await activeMembers(db, home.id);
  return answer(user, { home: { id: home.id, name: home.name, members: members.map((row) => row.username) } });
}

export async function joinHome(request: Request, db: Db, now: Date): Promise<Response> {
  const user = await requireUser(request, db, now);
  if (user instanceof Response) return user;
  const body = await readBody(request);
  const home = await findHome(db, text(body.code));
  if (!home) return refuse(user, 404, CODE_NOT_WORKING, "bad_code");
  if (await isInAHome(db, user.userId)) return refuse(user, 409, ALREADY_IN_A_HOME, "in_home");
  try {
    await db
      .prepare("INSERT INTO members (id, home_id, user_id, created_at) VALUES (?, ?, ?, ?)")
      .bind(crypto.randomUUID(), home.id, user.userId, wib(now))
      .run();
  } catch (error) {
    if (String(error).includes("UNIQUE")) return refuse(user, 409, ALREADY_IN_A_HOME, "in_home");
    throw error;
  }
  return answer(user, { user: await profile(db, user) });
}

export async function getHome(request: Request, db: Db, now: Date): Promise<Response> {
  const member = await requireMember(request, db, now);
  if (member instanceof Response) return member;
  return answer(member, { home: await homeSettings(db, member) });
}

/** A new code: the old code and invite link stop working, and every member keeps working. */
export async function resetHomeCode(request: Request, db: Db, now: Date): Promise<Response> {
  const member = await requireMember(request, db, now);
  if (member instanceof Response) return member;
  await db.prepare("UPDATE homes SET home_code = ? WHERE id = ?").bind(randomCode(HOME_CODE_LENGTH), member.homeId).run();
  return answer(member, { home: await homeSettings(db, member) });
}

/** Any member can remove another; that account loses access to the home at once. */
export async function removeMember(request: Request, db: Db, now: Date): Promise<Response> {
  const member = await requireMember(request, db, now);
  if (member instanceof Response) return member;
  const body = await readBody(request);
  const memberId = text(body.memberId);
  if (memberId === member.memberId) return refuse(member, 400, "To leave the home yourself, use Leave home.");
  const removed = await db
    .prepare("UPDATE members SET removed_at = ? WHERE id = ? AND home_id = ? AND removed_at IS NULL RETURNING id")
    .bind(wib(now), memberId, member.homeId)
    .first();
  if (!removed) return refuse(member, 404, "That person isn't in this home anymore.");
  return answer(member, { home: await homeSettings(db, member) });
}

/**
 * Leaves the home. When the last member leaves, the home gets a new code that
 * nobody knows, so an old invite link can't open an empty home's data.
 */
export async function leaveHome(request: Request, db: Db, now: Date): Promise<Response> {
  const member = await requireMember(request, db, now);
  if (member instanceof Response) return member;
  await db.batch([
    db.prepare("UPDATE members SET removed_at = ? WHERE id = ?").bind(wib(now), member.memberId),
    db
      .prepare(
        `UPDATE homes SET home_code = ? WHERE id = ?
         AND NOT EXISTS (SELECT 1 FROM members WHERE home_id = ? AND removed_at IS NULL)`,
      )
      .bind(randomCode(HOME_CODE_LENGTH), member.homeId, member.homeId),
  ]);
  return answer(member, { user: await profile(db, member) });
}
