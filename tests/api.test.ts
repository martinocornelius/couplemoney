// The Worker's account routes, run against schema.sql in SQLite with a chosen time.

import { test } from "node:test";
import assert from "node:assert/strict";
import { CODE_ALPHABET } from "../shared/homes.ts";
import { handle } from "../worker/app.ts";
import { APP, body, call, minutes, sessionOf, setup, signUp, START } from "./helpers/api.ts";

test("sign up logs you in with a secure session cookie", async () => {
  const { env } = setup();
  const response = await call(env, "POST", "/api/signup", { body: { username: " Martino ", passcode: "secret123" } });
  assert.equal(response.status, 201);
  const setCookie = response.headers.get("set-cookie") ?? "";
  for (const flag of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]) assert.ok(setCookie.includes(flag), flag);
  const { user } = await body(response);
  assert.deepEqual(user, { username: "martino", isAdmin: false, mustChangePasscode: false, home: null });

  const me = await call(env, "GET", "/api/me", { cookie: sessionOf(response) });
  assert.equal(me.status, 200);
  assert.equal((await body(me)).user.username, "martino");
});

test("the passcode is never stored, and no answer includes passcode data", async () => {
  const { env, sqlite } = setup();
  const cookie = await signUp(env, "martino", "secret123");
  const row = sqlite.prepare("SELECT * FROM users").get() as Record<string, unknown>;
  assert.ok(!JSON.stringify(row).includes("secret123"));
  const session = sqlite.prepare("SELECT token_hash FROM sessions").get() as { token_hash: string };
  assert.ok(!cookie.includes(session.token_hash), "the database keeps only the token's hash");

  const answers = [
    await call(env, "GET", "/api/me", { cookie }),
    await call(env, "POST", "/api/login", { body: { username: "martino", passcode: "secret123" } }),
  ];
  for (const answer of answers) {
    const text = await answer.text();
    for (const secret of ["secret123", "passcode_hash", "passcode_salt", "pbkdf2"]) assert.ok(!text.includes(secret), secret);
  }
});

test("sign up checks the rules, and usernames are unique ignoring capitals", async () => {
  const { env } = setup();
  await signUp(env, "martino");
  const taken = await call(env, "POST", "/api/signup", { body: { username: "MARTINO", passcode: "another1" } });
  assert.equal(taken.status, 409);
  assert.match((await body(taken)).error, /taken/);
  assert.equal((await call(env, "POST", "/api/signup", { body: { username: "ab", passcode: "secret123" } })).status, 400);
  assert.equal((await call(env, "POST", "/api/signup", { body: { username: "sari", passcode: "12345" } })).status, 400);
  assert.equal((await call(env, "POST", "/api/signup", { body: "not an object" })).status, 400);
});

test("every route except sign up, log in and health needs a session", async () => {
  const { env } = setup();
  for (const [method, path] of [
    ["GET", "/api/me"],
    ["POST", "/api/logout"],
    ["POST", "/api/passcode"],
    ["GET", "/api/admin/account?username=martino"],
    ["POST", "/api/admin/reset"],
    ["POST", "/api/homes"],
    ["GET", "/api/join?code=ABCDEFGHJKLM"],
    ["POST", "/api/join"],
    ["GET", "/api/home"],
    ["POST", "/api/home/code"],
    ["POST", "/api/home/remove-member"],
    ["POST", "/api/home/leave"],
  ]) {
    const response = await call(env, method, path, { body: method === "POST" ? {} : undefined });
    assert.equal(response.status, 401, `${method} ${path}`);
    assert.equal((await body(response)).code, "not_logged_in");
  }
  assert.equal((await call(env, "GET", "/api/health")).status, 200);
});

test("log out ends the session", async () => {
  const { env, sqlite } = setup();
  const cookie = await signUp(env, "martino");
  const out = await call(env, "POST", "/api/logout", { cookie });
  assert.equal(out.status, 204);
  assert.match(out.headers.get("set-cookie") ?? "", /Max-Age=0/);
  assert.equal((await call(env, "GET", "/api/me", { cookie })).status, 401);
  assert.equal((sqlite.prepare("SELECT count(*) AS n FROM sessions").get() as { n: number }).n, 0);
});

test("a wrong username and a wrong passcode get the same answer", async () => {
  const { env } = setup();
  await signUp(env, "martino");
  const wrongPasscode = await call(env, "POST", "/api/login", { body: { username: "martino", passcode: "nope1234" } });
  const noSuchUser = await call(env, "POST", "/api/login", { body: { username: "nobody", passcode: "nope1234" } });
  assert.equal(wrongPasscode.status, 401);
  assert.equal(noSuchUser.status, 401);
  assert.deepEqual(await body(wrongPasscode), await body(noSuchUser));
  const right = await call(env, "POST", "/api/login", { body: { username: "Martino", passcode: "secret123" } });
  assert.equal(right.status, 200);
  sessionOf(right);
});

test("5 wrong passcodes in a row lock the username for 15 minutes", async () => {
  const { env } = setup();
  await signUp(env, "sari");
  const login = (passcode: string, now = START) => call(env, "POST", "/api/login", { body: { username: "sari", passcode }, now });

  for (let i = 1; i <= 4; i++) assert.equal((await login("wrong-one")).status, 401, `attempt ${i}`);
  const fifth = await login("wrong-one");
  assert.equal(fifth.status, 429);
  assert.match((await body(fifth)).error, /Try again in 15 minutes/);

  const rightButLocked = await login("secret123", minutes(10));
  assert.equal(rightButLocked.status, 429, "even the right passcode waits");
  assert.match((await body(rightButLocked)).error, /5 minutes/);

  assert.equal((await login("secret123", minutes(16))).status, 200, "the lock ends after 15 minutes");
});

test("wrong passcodes sent at the same moment can't get past the limit", async () => {
  const { env } = setup();
  await signUp(env, "sari");
  const burst = await Promise.all(
    Array.from({ length: 20 }, (_, i) => call(env, "POST", "/api/login", { body: { username: "sari", passcode: `guess-${i}` } })),
  );
  const statuses = burst.map((answer) => answer.status);
  assert.equal(statuses.filter((status) => status === 401).length, 4, `answers: ${statuses.join(", ")}`);
  assert.equal(statuses.filter((status) => status === 429).length, 16);

  const right = await call(env, "POST", "/api/login", { body: { username: "sari", passcode: "secret123" } });
  assert.equal(right.status, 429, "locked after 5 checked passcodes");
});

test("wrong current passcodes on Change passcode count toward the lock too", async () => {
  const { env } = setup();
  const cookie = await signUp(env, "sari");
  const change = (currentPasscode: string) =>
    call(env, "POST", "/api/passcode", { cookie, body: { currentPasscode, newPasscode: "brand-new-1" } });
  for (let i = 1; i <= 4; i++) assert.equal((await change("wrong-one")).status, 400, `attempt ${i}`);
  assert.equal((await change("wrong-one")).status, 429);
  assert.equal((await change("secret123")).status, 429, "even the right passcode waits");
  const login = await call(env, "POST", "/api/login", { body: { username: "sari", passcode: "secret123" } });
  assert.equal(login.status, 429, "and logging in elsewhere waits too");
});

test("a successful log in resets the count of wrong passcodes", async () => {
  const { env } = setup();
  await signUp(env, "sari");
  const login = (passcode: string) => call(env, "POST", "/api/login", { body: { username: "sari", passcode } });
  for (let i = 0; i < 4; i++) await login("wrong-one");
  assert.equal((await login("secret123")).status, 200);
  for (let i = 0; i < 4; i++) assert.equal((await login("wrong-one")).status, 401);
});

test("changes are accepted only from the app's own address", async () => {
  const { env } = setup();
  const body = { username: "martino", passcode: "secret123" };
  assert.equal((await call(env, "POST", "/api/signup", { body, origin: null })).status, 403);
  assert.equal((await call(env, "POST", "/api/signup", { body, origin: "https://evil.example" })).status, 403);
  assert.equal((await call(env, "POST", "/api/signup", { body })).status, 201);
});

test("only the admin can find and reset accounts", async () => {
  const { env, sqlite } = setup();
  const martino = await signUp(env, "martino");
  await signUp(env, "sari");
  const find = (cookie: string) => call(env, "GET", "/api/admin/account?username=sari", { cookie });

  const refused = await find(martino);
  assert.equal(refused.status, 403);
  assert.equal((await body(refused)).code, "admin_only");
  assert.equal((await call(env, "POST", "/api/admin/reset", { cookie: martino, body: { username: "sari" } })).status, 403);

  sqlite.exec("UPDATE users SET is_admin = 1 WHERE username = 'martino'");
  const found = await find(martino);
  assert.equal(found.status, 200);
  const text = await found.text();
  assert.deepEqual(JSON.parse(text).account, { username: "sari", createdAt: "2026-10-20T10:00:00", lockedUntil: null, resetExpiresAt: null });
  assert.ok(!text.includes("hash") && !text.includes("salt"));
  assert.equal((await call(env, "GET", "/api/admin/account?username=nobody", { cookie: martino })).status, 404);

  const own = await call(env, "POST", "/api/admin/reset", { cookie: martino, body: { username: "martino" } });
  assert.equal(own.status, 400, "the admin uses Change passcode for their own account");
  assert.equal((await call(env, "GET", "/api/me", { cookie: martino })).status, 200, "and stays logged in");
});

test("an admin reset gives a one-time passcode, logs out everywhere and asks for a new passcode", async () => {
  const { env, sqlite } = setup();
  const admin = await signUp(env, "martino");
  sqlite.exec("UPDATE users SET is_admin = 1 WHERE username = 'martino'");
  const sariPhone = await signUp(env, "sari", "old-passcode");

  // Lock sari first: the reset also clears the lock.
  for (let i = 0; i < 5; i++) await call(env, "POST", "/api/login", { body: { username: "sari", passcode: "wrong-one" } });

  const reset = await call(env, "POST", "/api/admin/reset", { cookie: admin, body: { username: "Sari" } });
  assert.equal(reset.status, 200);
  const { oneTimePasscode, expiresAt, account } = await body(reset);
  assert.equal(oneTimePasscode.length, 10);
  for (const char of oneTimePasscode) assert.ok(CODE_ALPHABET.includes(char));
  assert.equal(expiresAt, "2026-10-21T10:00:00");
  assert.deepEqual(account, { username: "sari", createdAt: "2026-10-20T10:00:00", lockedUntil: null, resetExpiresAt: expiresAt });

  assert.equal((await call(env, "GET", "/api/me", { cookie: sariPhone })).status, 401, "logged out everywhere");
  const oldPasscode = await call(env, "POST", "/api/login", { body: { username: "sari", passcode: "old-passcode" } });
  assert.equal(oldPasscode.status, 401, "the old passcode no longer works");

  const login = await call(env, "POST", "/api/login", { body: { username: "sari", passcode: oneTimePasscode } });
  assert.equal(login.status, 200);
  assert.equal((await body(login)).user.mustChangePasscode, true);
  const session = sessionOf(login);

  const blocked = await call(env, "GET", "/api/admin/account?username=sari", { cookie: session });
  assert.equal((await body(blocked)).code, "passcode_change_required");
  assert.equal((await call(env, "GET", "/api/me", { cookie: session })).status, 200);

  const changed = await call(env, "POST", "/api/passcode", { cookie: session, body: { newPasscode: "brand-new-1" } });
  assert.equal(changed.status, 200);
  assert.equal((await body(changed)).user.mustChangePasscode, false);

  const again = await call(env, "POST", "/api/login", { body: { username: "sari", passcode: oneTimePasscode } });
  assert.equal(again.status, 401, "the one-time passcode works only until it's replaced");
  assert.equal((await call(env, "POST", "/api/login", { body: { username: "sari", passcode: "brand-new-1" } })).status, 200);
});

test("a one-time passcode stops working after 24 hours", async () => {
  const { env, sqlite } = setup();
  const admin = await signUp(env, "martino");
  sqlite.exec("UPDATE users SET is_admin = 1 WHERE username = 'martino'");
  await signUp(env, "sari");
  const { oneTimePasscode } = await body(await call(env, "POST", "/api/admin/reset", { cookie: admin, body: { username: "sari" } }));
  const late = await call(env, "POST", "/api/login", { body: { username: "sari", passcode: oneTimePasscode }, now: minutes(24 * 60 + 1) });
  assert.equal(late.status, 401);
  assert.equal((await body(late)).code, "reset_expired");
});

test("changing your passcode needs the current one and logs out your other devices", async () => {
  const { env } = setup();
  const phone = await signUp(env, "martino", "secret123");
  const laptopLogin = await call(env, "POST", "/api/login", { body: { username: "martino", passcode: "secret123" } });
  const laptop = sessionOf(laptopLogin);

  const wrong = await call(env, "POST", "/api/passcode", { cookie: phone, body: { currentPasscode: "nope1234", newPasscode: "brand-new-1" } });
  assert.equal(wrong.status, 400);
  assert.match((await body(wrong)).error, /current passcode is wrong/);
  const tooShort = await call(env, "POST", "/api/passcode", { cookie: phone, body: { currentPasscode: "secret123", newPasscode: "123" } });
  assert.equal(tooShort.status, 400);

  const changed = await call(env, "POST", "/api/passcode", { cookie: phone, body: { currentPasscode: "secret123", newPasscode: "brand-new-1" } });
  assert.equal(changed.status, 200);
  assert.equal((await call(env, "GET", "/api/me", { cookie: phone })).status, 200, "this device stays logged in");
  assert.equal((await call(env, "GET", "/api/me", { cookie: laptop })).status, 401, "other devices are logged out");
  assert.equal((await call(env, "POST", "/api/login", { body: { username: "martino", passcode: "secret123" } })).status, 401);
});

test("a session ends after 90 days without a visit, and visits keep it alive", async () => {
  const { env } = setup();
  const cookie = await signUp(env, "martino");
  const day = (n: number) => minutes(n * 24 * 60);

  const visit = await call(env, "GET", "/api/me", { cookie, now: day(60) });
  assert.equal(visit.status, 200);
  assert.match(visit.headers.get("set-cookie") ?? "", /Max-Age=7776000/, "the visit renews the cookie");
  assert.equal((await call(env, "GET", "/api/me", { cookie, now: day(140) })).status, 200, "90 days from the last visit");
  assert.equal((await call(env, "GET", "/api/me", { cookie, now: day(231) })).status, 401);
});

test("health checks the ten tables, and needs no session", async () => {
  const { env } = setup();
  const response = await call(env, "GET", "/api/health");
  assert.deepEqual(await body(response), { status: "ok", database: "connected", tables: "10 of 10" });
  const noDb = await handle(new Request(APP + "/api/health"), {});
  assert.equal(noDb.status, 503);
});
