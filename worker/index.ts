// The Worker: the small server that runs on Cloudflare.
// Page and file requests are answered straight from the built app;
// only /api/... requests reach this code (see run_worker_first in wrangler.jsonc).

import { TABLES } from "./tables.ts";

export interface Env {
  /** The D1 database (d1_databases in wrangler.jsonc); schema.sql creates its tables. */
  DB: D1Database;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

/** Says whether the Worker, the database and all ten tables are there. */
async function health(env: Env): Promise<Response> {
  if (!env.DB) {
    return json({ status: "needs setup", database: "not connected: the DB binding is missing from wrangler.jsonc" }, 503);
  }
  try {
    const { results } = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>();
    const found = new Set(results.map((row) => row.name));
    const missing = TABLES.filter((table) => !found.has(table));
    const tables = `${TABLES.length - missing.length} of ${TABLES.length}`;
    if (missing.length > 0) {
      return json({ status: "needs setup", database: "connected", tables, missing, hint: "Run schema.sql in the D1 Console" }, 503);
    }
    return json({ status: "ok", database: "connected", tables });
  } catch (error) {
    console.error("Health check: the database query failed", error);
    return json({ status: "error", database: "not reachable" }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return health(env);
    }

    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
