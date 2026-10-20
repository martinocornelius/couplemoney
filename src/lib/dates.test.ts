import { test } from "node:test";
import assert from "node:assert/strict";
import { formatWib } from "./dates.ts";

test("formats WIB dates for people", () => {
  assert.equal(formatWib("2026-10-20T14:05:00"), "20 Oct 2026, 14:05");
  assert.equal(formatWib("2026-01-02"), "2 Jan 2026");
  assert.equal(formatWib("not a date"), "not a date");
});
