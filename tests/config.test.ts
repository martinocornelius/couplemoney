// Checks wrangler.jsonc: the live app and preview links each reach a
// database as DB, and preview links can never reach the live one.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** Drops line and block comments outside strings, so the JSONC file parses as JSON. */
function stripComments(text: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === "\\") out += text[++i] ?? "";
      else if (c === '"') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      if (end === -1) break;
      i = end + 1;
    } else {
      out += c;
    }
  }
  return out;
}

type D1Binding = { binding: string; database_name: string; database_id: string };
type WranglerConfig = { d1_databases?: D1Binding[]; previews?: { d1_databases?: D1Binding[] } };

const config: WranglerConfig = JSON.parse(stripComments(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8")));
const live = config.d1_databases?.find((d) => d.binding === "DB");
const preview = config.previews?.d1_databases?.find((d) => d.binding === "DB");

test("the live app reaches its database as DB", () => {
  assert.ok(live, "d1_databases needs a DB binding");
  assert.match(live.database_id, /^[0-9a-f-]{36}$/);
});

test("preview links reach their own test database as DB", () => {
  assert.ok(preview, "previews.d1_databases needs a DB binding");
  assert.match(preview.database_id, /^[0-9a-f-]{36}$/);
  assert.notEqual(preview.database_id, live?.database_id, "previews must never use the live database");
  assert.notEqual(preview.database_name, live?.database_name);
});
