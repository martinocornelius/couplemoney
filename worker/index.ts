// The Worker: the small server that runs on Cloudflare.
// Page and file requests are answered straight from the built app;
// only /api/... requests reach this code (see run_worker_first in wrangler.jsonc).

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return new Response("ok", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler;
