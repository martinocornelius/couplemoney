# Couple Money

A shared money log for couples and their families. See [SPEC.md](SPEC.md) for what the app does and the build plan.

## How it is built

- **App:** React + Vite + TypeScript + Tailwind CSS, in `src/`. Each screen is a file in `src/screens/`.
- **Server:** one Cloudflare Worker, in `worker/index.ts`. It serves the built app and answers `/api/...` requests.
- **Settings:** `wrangler.jsonc` (the Worker's name is `couple-money`).

Cloudflare Workers Builds builds and deploys the app from GitHub:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command (main) | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` |

## Developer commands

`npm install`, `npm run dev` (local app), `npm test` (unit tests), `npm run build`.
