import { test } from "node:test";
import assert from "node:assert/strict";
import { formatHomeCode, normalizeHomeCode } from "../../shared/homes.ts";
import { inviteLink, inviteMessage } from "./invite.ts";

test("home codes are shown with dashes, and typed in any form", () => {
  assert.equal(formatHomeCode("ABCDEFGHJKLM"), "ABCD-EFGH-JKLM");
  assert.equal(normalizeHomeCode("abcd-efgh-jklm"), "ABCDEFGHJKLM");
  assert.equal(normalizeHomeCode(" ABCD EFGH JKLM "), "ABCDEFGHJKLM");
  assert.equal(normalizeHomeCode("ABCD-EFGH-JKL"), null, "too short");
  assert.equal(normalizeHomeCode("ABCD-EFGH-JKLO"), null, "O isn't used: it looks like 0");
  assert.equal(normalizeHomeCode("ABCD-EFGH-JK1M"), null, "1 isn't used: it looks like I");
});

test("the invite link and message", () => {
  const link = inviteLink("https://couple-money.example.workers.dev", "ABCDEFGHJKLM");
  assert.equal(link, "https://couple-money.example.workers.dev/join/ABCD-EFGH-JKLM");
  assert.equal(
    inviteMessage("Keluarga Martino", link),
    'Join our home "Keluarga Martino" on Couple Money, so we can track our money together:\n' + link,
  );
});
