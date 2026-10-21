// The Worker: the small server that runs on Cloudflare.
// Page and file requests are answered straight from the built app;
// only /api/... requests reach this code (see run_worker_first in wrangler.jsonc).
// The routes themselves live in app.ts.

import { handle } from "./app.ts";
import type { Db } from "./db.ts";

export interface Env {
  /** The D1 database (d1_databases in wrangler.jsonc); schema.sql creates its tables. */
  DB: D1Database;
}

export default {
  async fetch(request, env) {
    const db: Db | undefined = env.DB;
    return handle(request, { DB: db });
  },
} satisfies ExportedHandler<Env>;
