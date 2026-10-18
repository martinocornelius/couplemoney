# Build guide: from here to a live app

This guide takes Couple Money from where it is now (a skeleton with placeholder screens) to a live app your family uses every day. Follow the parts in order. [SPEC.md](SPEC.md) says **what** the app does; this guide says **what you click**.

To tick a box, edit this file on GitHub (pencil icon) and change `[ ]` to `[x]`.

**Where things are**

- Your code: github.com/martinocornelius/couplemoney (SPEC.md calls the repository couple-money; it's the same one)
- Claude sessions: claude.ai/code
- Cloudflare dashboard: dash.cloudflare.com
- Your live app, after Part 1: `https://couple-money.<your-subdomain>.workers.dev`

**The big picture**

| Part | What happens | Milestones |
| --- | --- | --- |
| 1 | Put the skeleton online | 1 |
| 2 | Add the database | 2 |
| 3 | Build the features, one at a time | 3 to 14 |
| 4 | Go live with your family | none |
| 5 | Keep improving (email sign-in next) | Later list |

## The loop you repeat for every milestone

From Milestone 2 on, every milestone follows these steps:

1. Open **claude.ai/code**, start a new session and choose the **couplemoney** repository. It starts from `main`, which holds everything merged so far.
2. Open SPEC.md on GitHub, scroll to **Build plan**, and copy the milestone's whole prompt (the paragraph right under its heading). Paste it into the session and send it.
3. Answer Claude's questions. Wait until it says it has pushed the changes.
4. Click **Create PR** in the session, then **Create pull request** on GitHub.
5. Wait a few minutes. Cloudflare adds a comment to the pull request with a **Preview URL**. Open it: that's the new version, not yet live.
6. Do the milestone's **Check it works** steps on the preview link. Test with test accounts (for example `test.a` and `test.b`), not your own: preview links use the same database as the live app.
7. If everything works, click **Merge pull request** on the pull request, then **Confirm merge**. A few minutes later, the live app has the new version.
8. If something is wrong, go back to the same session. Say what you did, what you expected and what happened, and paste a screenshot (Windows + Shift + S, then Ctrl + V). Claude fixes it and pushes to the same pull request, the preview updates, and you check again.
9. If Claude says the database needs a change, it gives you SQL to run. Run it in the D1 Console (see Part 2) before you test the preview.

Never start the next milestone before the current one is merged.

## Part 1: Put the skeleton online (today)

This order merges first, so that Cloudflare's very first build already succeeds.

### Step 1: Open the pull request for Milestone 1

- [ ] In the current Claude session, click **Create PR**. You can also ask Claude to create the pull request for you.
- [ ] On GitHub, click **Create pull request**.

### Step 2: Merge it

- [ ] On the pull request page, click **Merge pull request**, then **Confirm merge**.

There is no preview for this first one, because Cloudflare isn't connected yet. It only adds placeholder screens, so merging without a preview is safe.

### Step 3: Connect Cloudflare

Button names can differ a little from what's written here; look for the closest match.

- [ ] Go to **dash.cloudflare.com** and log in.
- [ ] In the left menu, open **Workers & Pages**. It may be inside a **Compute** section.
- [ ] If Cloudflare asks you to choose a **workers.dev subdomain**, pick a short name such as `martino`. It becomes part of your app's address.
- [ ] Click **Create application** (or **Create**), then **Import a repository**.
- [ ] Click **Connect GitHub**, allow access to the **couplemoney** repository, then select it.
- [ ] Fill in the form:

  | Field | Value |
  | --- | --- |
  | Project name | `couple-money` (exactly this, so it matches the code) |
  | Build command | `npm run build` |
  | Deploy command | `npx wrangler deploy` |
  | Builds for non-production branches | ticked |
  | Non-production branch deploy command | `npx wrangler versions upload` |
  | Root directory | leave empty |

- [ ] Click **Create and deploy** (or **Deploy**), then wait 2 to 4 minutes for the build to finish with a green tick.

### Step 4: Check the branch settings

- [ ] Open your **couple-money** Worker, then go to **Settings → Build → Branch control**. Make sure **Production branch** is `main` and **Builds for non-production branches** is on, then **Save**.
- [ ] In **Settings → Domains & Routes**, make sure **workers.dev** and **Preview URLs** both say **Enabled**.

### Step 5: Check the live app

- [ ] Open `https://couple-money.<your-subdomain>.workers.dev/api/health`. The page should show `ok`.
- [ ] On your phone, open `https://couple-money.<your-subdomain>.workers.dev/welcome` and tap through every screen: Landing, Sign up, Create or join, Home, the tabs, the + button and the links in Settings.
- [ ] Bookmark the address.

**Part 1 is done when** the live address works on your phone.

## Part 2: Add the database (Milestone 2)

- [ ] Start a new session and paste the **Milestone 2** prompt (the loop, steps 1 to 3). Claude will ask for a database ID.
- [ ] Create the database in Cloudflare:
  1. Go to **Storage & databases → D1 SQL database → Create database**.
  2. Name it `couple-money-db`.
  3. If it asks for a location, pick **Asia-Pacific**, the closest to Indonesia.
  4. Click **Create**.
- [ ] Copy the **Database ID** from the database's page and paste it into the Claude session. The ID is not a secret.
- [ ] Ask Claude: "Show me schema.sql so I can copy it." Copy all of it.
- [ ] **Run SQL:** on the database's page, open **Console**, paste the SQL and click **Execute**. This is also how you run any SQL Claude gives you later.
- [ ] Continue with the loop from step 4. Check that the ten tables are listed and that the preview's `/api/health` says the database is connected, then merge.

## Part 3: Build the features (Milestones 3 to 14)

Run the loop once for each milestone below, in order. Some have extra steps.

- [ ] **Milestone 3: Sign up, log in and admin reset.** On the preview link, sign up with **your real username** (for example `martino`) and a passcode you'll remember. Preview links share the live database, so this is your real account. Then make yourself the admin: in the D1 Console, run the line below with your own username. Use test accounts in an incognito window for the other checks.

  ```sql
  UPDATE users SET is_admin = 1 WHERE username = 'martino';
  ```

- [ ] **Milestone 4: Create and join a home.** Test with two test accounts in a home called "Test home". Keep your own account out of it, because you'll create your real home in Part 4. Use these test accounts for every check from here on.
- [ ] **Milestone 5: Pockets and categories**
- [ ] **Milestone 6: Transactions and transfers**
- [ ] **Milestone 7: Home feed, totals and live updates**
- [ ] **Milestone 8: Payables, receivables and net worth**
- [ ] **Milestone 9: Monthly budgets**
- [ ] **Milestone 10: Savings goals and balance check**
- [ ] **Milestone 11: Recurring entries.** Scheduled jobs don't run on preview links. After merging, add one test entry on the live app with tomorrow's day, and check the next morning that it was recorded by itself.
- [ ] **Milestone 12: Monthly summary, charts and insights**
- [ ] **Milestone 13: Export to Excel.** Open the downloaded file in Excel or Google Sheets (Google Drive → New → File upload, then open it) to check it.
- [ ] **Milestone 14: Polish and home-screen shortcut.** At the end, ask Claude: "List anything in SPEC.md that is not built yet." The list should be empty.

## Part 4: Go live with your family

- [ ] Go through the **MVP done checklist** in SPEC.md on two real phones, yours and your wife's. Fix anything that fails with a small extra session: use the loop, but describe the problem instead of pasting a milestone prompt.
- [ ] On the live app, log in with your real account and create your real home.
- [ ] Send your wife the invite link (Home settings → Share). She signs up and joins.
- [ ] Add your real pockets, with today's balances from your bank and e-wallet apps.
- [ ] Add your savings goals (your dreams), monthly budgets, and recurring entries such as salary, rent and your monthly saving transfer.
- [ ] Put the app on both home screens:
  - **iPhone:** in Safari, tap **Share → Add to Home Screen**.
  - **Android:** in Chrome, tap **⋮ → Add to home screen** (or **Install app**).
- [ ] Start the habit: log every payment right when you pay. Once a month, sit together for 15 minutes, adjust each pocket's balance to match your bank apps, and read the monthly summary and its insights together.

Other families can sign up at the same address and make their own home; they never see yours. Your test accounts and "Test home" can stay, because nobody else can see them either.

## Part 5: After launch

- **Email sign-in** is the planned next upgrade (see the Later list in SPEC.md). When you're ready, start a session and paste:

  ```text
  Read SPEC.md and build the Email sign-in upgrade from the Later list. I am a beginner and can't run commands, so explain every step in simple words.
  ```

- **Any other change:** edit SPEC.md first (pencil icon on GitHub), then start a session with "Re-read SPEC.md and build …". Follow the same loop.

## If something goes wrong

- **A Cloudflare build failed** (a red cross on the pull request or in the Worker's deployments): open the build log, copy the red error lines and paste them into that milestone's session.
  - If the log says `tsc: not found` or `Cannot find module`, go to the Worker's **Settings → Build** and change the build command to `npm ci && npm run build`.
  - If it complains about the Node.js version, go to **Settings → Build → Variables**, add `NODE_VERSION` with the value `22`, then retry the build.
- **No preview link on a pull request:** check Part 1, step 4. The first preview can take a few minutes.
- **The live app broke after a merge:** open that pull request on GitHub and click **Revert**, then **Create pull request** and **Merge**. The previous version is back within a few minutes.
- **The same bug survives 3 fixes:** ask Claude to explain the cause before it changes more code, or revert.
- **Someone forgot their passcode:** first confirm it's really them (for example with a call). Then, as the admin, open **Admin**, find their username, tap **Reset passcode**, and send them the one-time passcode privately.
- **You, the admin, forgot your own passcode:** sign up a new account (for example `martino.admin`) and make it the admin with the D1 Console line from Milestone 3. Log in with it and reset your old account from **Admin**.
- **Something was deleted by mistake:** Cloudflare D1 keeps automatic restore points (called Time Travel). Start a session and ask Claude to walk you through restoring.

## What it costs

- **GitHub:** free.
- **Cloudflare:** the free plan covers a family app. Workers allows 100,000 requests a day for free, and one open phone checks for updates 720 times an hour. If you ever outgrow it, Workers Paid costs US$5 a month.
- **Claude:** a Pro plan or higher, for building.
