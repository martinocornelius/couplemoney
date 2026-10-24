// Creating, joining and leaving homes, and Home settings, run against
// schema.sql in SQLite.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CATEGORIES } from "../shared/categories.ts";
import { CODE_ALPHABET, formatHomeCode } from "../shared/homes.ts";
import type { AppEnv } from "../worker/app.ts";
import { body, call, setup, signUp } from "./helpers/api.ts";

async function createHome(env: AppEnv, cookie: string, name = "Our home"): Promise<Record<string, any>> {
  const response = await call(env, "POST", "/api/homes", { cookie, body: { name } });
  assert.equal(response.status, 201, await response.clone().text());
  return (await body(response)).user;
}

async function homeSettings(env: AppEnv, cookie: string): Promise<Record<string, any>> {
  const response = await call(env, "GET", "/api/home", { cookie });
  assert.equal(response.status, 200, await response.clone().text());
  return (await body(response)).home;
}

/** martino creates "Our home"; sari has an account but no home yet. */
async function twoAccounts() {
  const { env, sqlite } = setup();
  const martino = await signUp(env, "martino");
  const sari = await signUp(env, "sari");
  await createHome(env, martino);
  const { code } = await homeSettings(env, martino);
  return { env, sqlite, martino, sari, code: code as string };
}

test("creating a home makes you its first member and adds the default categories", async () => {
  const { env, sqlite } = setup();
  const martino = await signUp(env, "martino");
  const user = await createHome(env, martino, "  Keluarga Martino  ");
  assert.equal(user.home.name, "Keluarga Martino");

  const me = await body(await call(env, "GET", "/api/me", { cookie: martino }));
  assert.deepEqual(me.user.home, user.home);

  const home = await homeSettings(env, martino);
  assert.equal(home.code.length, 12);
  for (const char of home.code) assert.ok(CODE_ALPHABET.includes(char), char);
  assert.deepEqual(
    home.members.map((member: Record<string, unknown>) => [member.username, member.you, member.joinedAt]),
    [["martino", true, "2026-10-20T10:00:00"]],
  );

  const categories = sqlite
    .prepare("SELECT kind, name, emoji, built_in, hidden, created_by FROM categories ORDER BY sort_order")
    .all() as Record<string, unknown>[];
  assert.deepEqual(
    categories.map((row) => [row.kind, row.name, row.emoji, row.built_in === 1]),
    DEFAULT_CATEGORIES.map((category) => [category.kind, category.name, category.emoji, category.builtIn === true]),
  );
  assert.equal(categories.length, 27);
  assert.ok(categories.every((row) => row.hidden === 0 && row.created_by === null));
});

test("a home needs a name of up to 50 characters, and you can be in only one home", async () => {
  const { env } = setup();
  const martino = await signUp(env, "martino");
  for (const name of ["", "   ", "x".repeat(51)]) {
    assert.equal((await call(env, "POST", "/api/homes", { cookie: martino, body: { name } })).status, 400, `"${name}"`);
  }
  await createHome(env, martino, "x".repeat(50));
  const second = await call(env, "POST", "/api/homes", { cookie: martino, body: { name: "Second home" } });
  assert.equal(second.status, 409);
  assert.equal((await body(second)).code, "in_home");
});

test("the invite code shows the home's name and members, and joining adds you", async () => {
  const { env, martino, sari, code } = await twoAccounts();

  // Typed with dashes and small letters, the code still works.
  const typed = formatHomeCode(code).toLowerCase();
  const found = await call(env, "GET", `/api/join?code=${typed}`, { cookie: sari });
  assert.equal(found.status, 200);
  const { home } = await body(found);
  assert.equal(home.name, "Our home");
  assert.deepEqual(home.members, ["martino"]);

  const joined = await call(env, "POST", "/api/join", { cookie: sari, body: { code: typed } });
  assert.equal(joined.status, 200);
  assert.equal((await body(joined)).user.home.id, home.id);

  const settings = await homeSettings(env, martino);
  assert.deepEqual(
    settings.members.map((member: Record<string, unknown>) => [member.username, member.you]),
    [
      ["martino", true],
      ["sari", false],
    ],
  );
  assert.equal((await homeSettings(env, sari)).members[1].you, true);
});

test("a wrong code finds nothing, and an account in a home can't join another", async () => {
  const { env, martino, sari, code } = await twoAccounts();
  for (const wrong of ["ABCDEFGHJKLM", "not-a-code", "", code.slice(0, 11)]) {
    const lookUp = await call(env, "GET", `/api/join?code=${encodeURIComponent(wrong)}`, { cookie: sari });
    assert.equal(lookUp.status, 404, wrong);
    assert.equal((await body(lookUp)).code, "bad_code");
    assert.equal((await call(env, "POST", "/api/join", { cookie: sari, body: { code: wrong } })).status, 404, wrong);
  }

  const other = await signUp(env, "budi");
  await createHome(env, other, "Budi's home");
  const refused = await call(env, "POST", "/api/join", { cookie: other, body: { code } });
  assert.equal(refused.status, 409);
  assert.equal((await body(refused)).code, "in_home");
  assert.deepEqual(
    (await homeSettings(env, martino)).members.map((member: Record<string, unknown>) => member.username),
    ["martino"],
  );
});

test("resetting the home code stops the old code, and every member keeps working", async () => {
  const { env, martino, sari, code } = await twoAccounts();
  await call(env, "POST", "/api/join", { cookie: sari, body: { code } });

  const reset = await call(env, "POST", "/api/home/code", { cookie: sari });
  assert.equal(reset.status, 200);
  const newCode = (await body(reset)).home.code;
  assert.notEqual(newCode, code);

  const late = await signUp(env, "budi");
  assert.equal((await call(env, "GET", `/api/join?code=${code}`, { cookie: late })).status, 404, "the old link fails");
  assert.equal((await call(env, "POST", "/api/join", { cookie: late, body: { code } })).status, 404);
  assert.equal((await call(env, "GET", `/api/join?code=${newCode}`, { cookie: late })).status, 200, "the new one works");

  assert.equal((await homeSettings(env, martino)).code, newCode);
  assert.equal((await homeSettings(env, sari)).members.length, 2);
});

test("a removed member loses access at once, and can't remove anyone back", async () => {
  const { env, martino, sari, code } = await twoAccounts();
  await call(env, "POST", "/api/join", { cookie: sari, body: { code } });
  const sariMember = (await homeSettings(env, martino)).members[1];

  const removed = await call(env, "POST", "/api/home/remove-member", { cookie: martino, body: { memberId: sariMember.id } });
  assert.equal(removed.status, 200);
  assert.deepEqual(
    (await body(removed)).home.members.map((member: Record<string, unknown>) => member.username),
    ["martino"],
  );

  const blocked = await call(env, "GET", "/api/home", { cookie: sari });
  assert.equal(blocked.status, 403);
  assert.equal((await body(blocked)).code, "no_home");
  assert.equal((await body(await call(env, "GET", "/api/me", { cookie: sari }))).user.home, null, "still logged in, without a home");
  assert.equal((await call(env, "POST", "/api/home/code", { cookie: sari })).status, 403);

  const again = await call(env, "POST", "/api/home/remove-member", { cookie: martino, body: { memberId: sariMember.id } });
  assert.equal(again.status, 404, "already removed");

  // With the current code, they can join again; resetting the code stops that.
  assert.equal((await call(env, "POST", "/api/join", { cookie: sari, body: { code } })).status, 200);
});

test("you can't remove yourself, or anyone in another home", async () => {
  const { env, martino, sari } = await twoAccounts();
  const me = (await homeSettings(env, martino)).members[0];
  const self = await call(env, "POST", "/api/home/remove-member", { cookie: martino, body: { memberId: me.id } });
  assert.equal(self.status, 400);

  await createHome(env, sari, "Sari's home");
  const sariMember = (await homeSettings(env, sari)).members[0];
  const outside = await call(env, "POST", "/api/home/remove-member", { cookie: martino, body: { memberId: sariMember.id } });
  assert.equal(outside.status, 404);
  assert.equal((await homeSettings(env, sari)).members.length, 1, "sari is still in her own home");
});

test("each home sees only its own members", async () => {
  const { env, martino, sari } = await twoAccounts();
  await createHome(env, sari, "Sari's home");
  const mine = await homeSettings(env, martino);
  const hers = await homeSettings(env, sari);
  assert.notEqual(mine.id, hers.id);
  assert.notEqual(mine.code, hers.code);
  assert.deepEqual(mine.members.map((member: Record<string, unknown>) => member.username), ["martino"]);
  assert.deepEqual(hers.members.map((member: Record<string, unknown>) => member.username), ["sari"]);
});

test("leaving a home ends access; the last one out also retires the code", async () => {
  const { env, martino, sari, code } = await twoAccounts();
  await call(env, "POST", "/api/join", { cookie: sari, body: { code } });

  const left = await call(env, "POST", "/api/home/leave", { cookie: sari });
  assert.equal(left.status, 200);
  assert.equal((await body(left)).user.home, null);
  assert.equal((await call(env, "GET", "/api/home", { cookie: sari })).status, 403);
  assert.equal((await homeSettings(env, martino)).code, code, "someone is still home, so the code stays");

  const lastOut = await call(env, "POST", "/api/home/leave", { cookie: martino });
  assert.equal((await body(lastOut)).user.home, null);
  assert.equal((await call(env, "GET", `/api/join?code=${code}`, { cookie: sari })).status, 404, "nobody can join an empty home");

  // Both can start again.
  await createHome(env, martino, "New home");
  assert.equal((await homeSettings(env, martino)).name, "New home");
});

test("home settings need a home", async () => {
  const { env } = setup();
  const lonely = await signUp(env, "lonely");
  for (const [method, path] of [
    ["GET", "/api/home"],
    ["POST", "/api/home/code"],
    ["POST", "/api/home/remove-member"],
    ["POST", "/api/home/leave"],
  ]) {
    const response = await call(env, method, path, { cookie: lonely, body: method === "POST" ? {} : undefined });
    assert.equal(response.status, 403, `${method} ${path}`);
    assert.equal((await body(response)).code, "no_home");
  }
});

test("rejoining after leaving makes a new membership, and the old one stays for history", async () => {
  const { env, sqlite, sari, code } = await twoAccounts();
  await call(env, "POST", "/api/join", { cookie: sari, body: { code } });
  await call(env, "POST", "/api/home/leave", { cookie: sari });
  assert.equal((await call(env, "POST", "/api/join", { cookie: sari, body: { code } })).status, 200);
  const rows = sqlite
    .prepare("SELECT removed_at FROM members m JOIN users u ON u.id = m.user_id WHERE u.username = 'sari' ORDER BY m.rowid")
    .all() as { removed_at: string | null }[];
  assert.deepEqual(
    rows.map((row) => row.removed_at),
    ["2026-10-20T10:00:00", null],
  );
});
