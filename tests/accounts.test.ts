import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeUsername, passcodeProblem, usernameProblem } from "../shared/accounts.ts";

test("usernames are 3 to 20 lowercase letters, numbers, dots or underscores", () => {
  assert.equal(usernameProblem("martino"), null);
  assert.equal(usernameProblem("test.sari_2"), null);
  assert.notEqual(usernameProblem("ab"), null);
  assert.notEqual(usernameProblem("Martino"), null);
  assert.notEqual(usernameProblem("sari@home"), null);
  assert.notEqual(usernameProblem("a".repeat(21)), null);
});

test("usernames are stored lowercase without spaces around them", () => {
  assert.equal(normalizeUsername("  Martino "), "martino");
});

test("passcodes have 6 to 64 characters of any kind", () => {
  assert.equal(passcodeProblem("123456"), null);
  assert.equal(passcodeProblem("my dog Bo!"), null);
  assert.notEqual(passcodeProblem("12345"), null);
  assert.notEqual(passcodeProblem("x".repeat(65)), null);
});
