# 5 State Group

Shared portfolio + expense tracker for a group of 5 friends. **Now backed by Supabase** — one shared Postgres database, real login, and live sync so all 5 of you see the same data update in real time (no more per-browser localStorage). Fully responsive — works on phones, tablets, and desktop.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New project**. Pick any name/region, set a database password (save it somewhere), and wait ~2 minutes for it to provision.
3. Once the project opens, click the **Connect** button near the top of the project dashboard (or go to **Project Settings → API Keys** in the left sidebar). You need two values:
   - **Project URL** — looks like `https://xxxxxxxx.supabase.co`. If you don't see it labeled that way, it's also shown at the top of the **Connect** dialog, or under **Project Settings → General** as "Reference ID" (combine as `https://<reference-id>.supabase.co`).
   - Your **public API key** — Supabase renamed this recently. Newer projects call it the **Publishable key** (starts with `sb_publishable_...`); older projects still show it as the **anon / public** key (a long string starting with `eyJ...`). Either works the same way here — grab whichever one your project shows under **Project Settings → API Keys**.
   - Do **not** use the **Secret key** / `service_role` key for this app — that one bypasses all the security rules and must never go in a browser-facing app.

If you genuinely can't find either value, click **Connect** at the top of the project page — it shows both together for whichever framework you pick (choose "React" or just copy the raw URL/key shown there).

## 2. Create the tables

1. In the left sidebar, open **SQL Editor → New query**.
2. Open `schema.sql` (in this folder), copy its entire contents, paste into the SQL editor, and click **Run**.
3. This creates `members` (pre-seeded with Prasanth/Balaji/Gokul/Ravi/Suresh), `transactions`, and `holdings`, turns on Row Level Security (only signed-in users can read/write — anonymous access is blocked), and enables Realtime so everyone's screen updates live.

## 3. Create the 5 login accounts

1. In the left sidebar, go to **Authentication → Users → Add user**. Create one user per member with their real email + a password (share the password with them, or have each person reset it after first login).
2. Back in **SQL Editor**, link each member's email so the app knows who's who, e.g.:
   ```sql
   update members set email = 'prasanth@example.com' where id = 'm1';
   update members set email = 'balaji@example.com'   where id = 'm2';
   update members set email = 'gokul@example.com'    where id = 'm3';
   update members set email = 'ravi@example.com'     where id = 'm4';
   update members set email = 'suresh@example.com'   where id = 'm5';
   ```

## 4. Connect the app to your project

```bash
cd 5-state-group
cp .env.example .env
```

(On Windows Command Prompt use `copy .env.example .env` instead; PowerShell can use either `copy` or `Copy-Item`.)

Open `.env` and fill in the two values from step 1:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 5. Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`), sign in with one of the 5 accounts, and you're in. Open it on a second device/browser and log transactions on both — changes should appear on the other within a second or two (Realtime).

## 6. Deploy to the web (optional)

`npm run dev` only serves the app on your own computer. To give all 5 of you a real URL you can open from any phone or laptop, deploy it — free, and takes about 5 minutes.

**Vercel (recommended)**

1. Push this project to a GitHub repo (a private repo is fine).
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, click **Add New → Project**, and pick the repo.
3. Vercel auto-detects Vite — leave the defaults (Build command `npm run build`, Output directory `dist`).
4. Before deploying, add your two environment variables under **Environment Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as your `.env`).
5. Click **Deploy**. You'll get a live URL like `https://5-state-group.vercel.app` — share that instead of localhost.

**Netlify (alternative)** — same idea: connect the repo, set build command `npm run build`, publish directory `dist`, and add the same two environment variables under Site settings → Environment variables.

No code changes are needed for either host — the two env var values just get baked into the production build on their servers instead of your own machine.

A few things worth knowing:
- **Updating later** — push new commits to GitHub and both Vercel and Netlify auto-redeploy.
- **Auth** — plain email/password sign-in (what this app uses) needs no extra Supabase configuration after deploying. If you later add magic-link or OAuth login, you'd need to add your deployed URL under Supabase's Authentication → URL Configuration → Redirect URLs.
- **Cost** — Vercel/Netlify's free tier and Supabase's free tier are both enough for a 5-person app like this.
- **Mobile** — the site is responsive (stacked cards on phones instead of wide tables) and can be added to a phone's home screen like an app via the browser's "Add to Home Screen" option, for quicker access.

## What's built

- **Transaction Dashboard** (`/transactions`) — add/edit/delete, filter, sort, running balance. Supports an "Everyone (split equally)" option that fans out into one real transaction per member — equal shares for money coming in (contributions, dividends), proportional to each member's current idle cash for money going out (investments, withdrawals) so it drains actual holdings correctly instead of going negative. For Dividend/Return and Loan Repayment Received specifically, an optional "Collected by" field lets you pick who actually received the cash — the app still credits everyone's equal share for ownership/history, then auto-generates the Transfer transactions needed to move the other members' shares to whoever actually has the money, so idle cash matches reality without manual cleanup. Also supports member-to-member cash "Transfer". Shows as stacked cards on mobile, a full table on larger screens.
- **Overall Dashboard** (`/`) — pooled fund, portfolio value, cash available, invested-vs-current, a category breakdown pie chart, recent transactions, and 5 per-category performance cards (Lending / Stock Market / Real Estate / Liquid Fund / Others) with invested, current value, absolute returns, XIRR, CAGR, and position count.
- **Individual Dashboard** (`/me`) — pick any member, see their contribution, ownership %, share of holdings, personal transaction history, and a "who's holding idle cash" card per member.
- **Login** — real Supabase email/password (see step 3 above). No public sign-up screen on purpose; accounts are created by whoever set up the project.
- **Stock price sync (experimental)** — Stock Market holdings can carry a ticker, quantity, and average price. A "Refresh prices" button in the Holdings section fetches live prices from [Twelve Data](https://twelvedata.com) (needs your own free API key, entered in that panel). Confirmed via live testing: Twelve Data's free "Basic" plan only covers US stocks/forex/crypto — NSE (India) tickers need their paid "Grow" plan ($29/mo) or higher, otherwise you'll get an HTTP 404. Manual "Current value" updates in the Holdings section work regardless and are the simplest option if you don't want to pay for a data plan.
- **Responsive design** — stacked-card layouts on mobile for tables, safe-area padding for notched phones, and an "Add to Home Screen" friendly setup.

## Data model

- **members**: id, name, email (matched to the Supabase Auth account), date_joined.
- **transactions**: date, member_id, to_member_id (Transfers only), type, category, amount, status, notes, linked_asset, batch_id/batch_total/batch_co