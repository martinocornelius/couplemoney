import { test } from "node:test";
import assert from "node:assert/strict";
import { CODE_ALPHABET } from "../shared/homes.ts";
import { hashPasscode, PBKDF2_ITERATIONS, randomCode, verifyPasscode } from "../worker/auth.ts";

test("a passcode hash is PBKDF2-SHA256 with its round count and its own salt", async () => {
  const first = await hashPasscode("secret123");
  const second = await hashPasscode("secret123");
  assert.match(first.hash, new RegExp(`^pbkdf2-sha256:${PBKDF2_ITERATIONS}:[A-Za-z0-9+/]+=*$`));
  assert.notEqual(first.salt, second.salt, "every account gets its own salt");
  assert.notEqual(first.hash, second.hash);
  assert.ok(!first.hash.includes("secret123"));
});

test("only the right passcode matches the hash", async () => {
  const { hash, salt } = await hashPasscode("secret123");
  assert.equal(await verifyPasscode("secret123", hash, salt), true);
  assert.equal(await verifyPasscode("secret124", hash, salt), false);
  assert.equal(await verifyPasscode("", hash, salt), false);
});

test("hashes made with another round count still verify", async () => {
  // The stored round count is used, so lowering or raising it later keeps old passcodes working.
  const { hash, salt } = await hashPasscode("secret123");
  const [, , digest] = hash.split(":");
  assert.equal(await verifyPasscode("secret123", `pbkdf2-sha256:1000:${digest}`, salt), false);
  assert.equal(await verifyPasscode("secret123", "something-else", salt), false);
});

test("one-time codes use only the look-alike-free alphabet", () => {
  for (let i = 0; i < 50; i++) {
    const code = randomCode(10);
    assert.equal(code.length, 10);
    for (const char of code) assert.ok(CODE_ALPHABET.includes(char), char);
  }
  assert.equal(CODE_ALPHABET.length, 32);
  for (const lookAlike of "01IO") assert.ok(!CODE_ALPHABET.includes(lookAlike));
});
