# Couple Money

A shared money log for couples and their families. See [SPEC.md](SPEC.md) for what the app does and the build plan.

**Building it?** Follow [BUILD-GUIDE.md](BUILD-GUIDE.md), step by step until the app is live.

## How it is built

- **App:** React + Vite + TypeScript + Tailwind CSS, in `src/`. Each screen from SPEC.md is a file in `src/screens/`.
- **Server:** one Cloudflare Worker. `worker/index.ts` serves the built app and hands `/api/...` requests to `worker/app.ts`. Accounts are in `worker/app.ts` and `worker/auth.ts` (passcode hashing and sessions), homes in `worker/homes.ts`, and `worker/access.ts` checks who is asking and which home they're in. The rules in `shared/` (usernames, passcodes, home names and codes, default categories) are used by both the app and the Worker.
- **Database:** Cloudflare D1: `couple-money-db` for the live app and `couple-money-preview-db` for preview links (the `previews` block in `wrangler.jsonc`). `schema.sql` creates the ten tables (run it in each database's D1 Console); `tests/schema.test.ts` checks the rules in it.
- **Settings:** `wrangler.jsonc` (the Worker's name is `couple-money`).

Cloudflare Workers Builds builds and deploys the app from GitHub:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command (main) | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler preview` |

## API

| Route | What it does |
| --- | --- |
| `GET /api/health` | Checks the database and its ten tables |
| `POST /api/signup` | Creates an account and logs it in |
| `POST /api/login` | Logs in; 5 wrong passcodes in a row lock the username for 15 minutes |
| `POST /api/logout` | Ends this browser's session |
| `GET /api/me` | The logged-in account: username, admin or not, and its home |
| `POST /api/passcode` | Changes the passcode and logs out the account's other devices |
| `GET /api/admin/account?username=` | Admin only: when an account was made and whether it is locked |
| `POST /api/admin/reset` | Admin only: gives the account a one-time passcode, valid for 24 hours |
| `POST /api/homes` | Creates a home with the default categories; you become its first member |
| `GET /api/join?code=` | The home with that code: its name and members (for the Join screen) |
| `POST /api/join` | Joins the home with that code |
| `GET /api/home` | Home settings: name, code and members of your home |
| `POST /api/home/code` | Replaces your home's code; old invite links stop working |
| `POST /api/home/remove-member` | Removes another member from your home |
| `POST /api/home/leave` | Leaves your home |

Every route except health, sign up and log in needs the session cookie, and requests that change something must come from the app's own address (the `Origin` header). The `/api/home/...` routes work only on the caller's own home.

## Developer commands

`npm install`, `npm run dev` (local app), `npm test` (unit tests, plus API tests that run the Worker against `schema.sql` in SQLite), `npm run build`.
