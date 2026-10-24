import { test } from "node:test";
import assert from "node:assert/strict";
import { nextPage, withNext } from "./next.ts";

test("only an invite page can be the page to go back to", () => {
  assert.equal(nextPage("?next=%2Fjoin%2FABCD-EFGH-JKLM"), "/join/ABCD-EFGH-JKLM");
  assert.equal(nextPage("?next=/join/abcdefghjklm"), "/join/abcdefghjklm");
  for (const search of [
    "",
    "?next=",
    "?next=/settings",
    "?next=https://evil.example/join/ABCD",
    "?next=//evil.example/join/ABCD",
    "?next=/join/",
    "?next=/join/ABCD/../../settings",
    "?next=/join/ABCD%3Fx%3D1",
  ]) {
    assert.equal(nextPage(search), null, search);
  }
});

test("withNext carries the invite page along", () => {
  assert.equal(withNext("/signup", "/join/ABCD-EFGH-JKLM"), "/signup?next=%2Fjoin%2FABCD-EFGH-JKLM");
  assert.equal(withNext("/signup", null), "/signup");
  assert.equal(nextPage(withNext("/login", "/join/ABCD-EFGH-JKLM").slice("/login".length)), "/join/ABCD-EFGH-JKLM");
});
