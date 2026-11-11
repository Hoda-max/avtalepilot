# AvtalePilot

Contract and deadline management for one organization (ready for many orgs later).

**Stack:** Next.js + TypeScript + Tailwind CSS + Supabase

## Quick start (local)

1. Install Node.js LTS
2. In this folder:

```bash
npm install
```

3. Create `.env.local` (copy from `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

Use the **Project URL** and the long **anon/public** key (`eyJ...`) from Supabase → Project Settings → API.  
The URL must end with `.supabase.co` (nothing after it).

4. Run database setup in Supabase **SQL Editor** (in order):

- `supabase/migrations/001_organizations_profiles.sql`
- `supabase/migrations/002_suppliers_contracts.sql`
- `supabase/migrations/003_dates_reminders_decisions.sql`
- `supabase/migrations/004_reminder_emails.sql`

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Optional sample data

After you have at least one logged-in user/profile, run:

- `supabase/seed/001_sample_data.sql`

This adds demo suppliers, contracts, dates, a reminder, and a decision.

## What the MVP can do

- Log in / create account
- One organization with admin/member roles
- Suppliers and contracts (search + filters)
- Upload contract PDF/image
- Key dates + automatic reminders (90/30/7 days)
- Decisions: renew / renegotiate / end
- Dashboard of open reminders and upcoming deadlines
- Email reminders via Resend (admin can send due emails from Settings)

## Email reminders (Resend)

1. Create a free account at [https://resend.com](https://resend.com)
2. Create an API key
3. Add to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=AvtalePilot <onboarding@resend.dev>
REMINDER_CRON_SECRET=change-me-to-a-long-random-string
```

4. Run `supabase/migrations/004_reminder_emails.sql` in Supabase
5. Restart `npm run dev`
6. Make sure a reminder is due today (or use sample data)
7. Go to **Settings** → **Send due reminders now**

### Automatic daily emails (Vercel Cron)

After deploy, Vercel runs `/api/reminders/send` every day at **07:00 UTC** (`vercel.json`).

In Vercel → Project → Settings → Environment Variables, set:

- `CRON_SECRET` = a long random string (Vercel Cron sends it as `Authorization: Bearer …`)
- You can use the same value as `REMINDER_CRON_SECRET`

Also set `NEXT_PUBLIC_APP_URL` to your real site URL, e.g. `https://your-app.vercel.app`.

Manual test after deploy:

```bash
curl -X GET "https://YOUR_DOMAIN/api/reminders/send" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Deploy to Vercel

1. Create a free account at [https://vercel.com](https://vercel.com)
2. Push this project to GitHub **or** deploy from the Vercel dashboard / CLI
3. In Vercel → Project → **Settings → Environment Variables**, add the same values as `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `REMINDER_CRON_SECRET`
4. Deploy
5. In Supabase → **Authentication → URL configuration**, add your Vercel URL to:
   - Site URL (optional for password login)
   - Redirect URLs (if you later add email links)

### Deploy with CLI (optional)

```bash
npm i -g vercel
vercel login
vercel
```

Follow the prompts, then set the environment variables in the Vercel project settings and redeploy.

## Project map

| Path | Purpose |
|------|---------|
| `src/app` | Pages (login, dashboard, contracts, suppliers, settings) |
| `src/lib/supabase` | Supabase browser/server helpers |
| `supabase/migrations` | Database setup SQL |
| `supabase/seed` | Optional demo data |

## Notes for beginners

- Passwords cannot be viewed later — reset them in Supabase → Authentication → Users
- New users may need email confirmation; confirm with SQL or disable Confirm email in Auth settings
- Keep `.env.local` private — never commit it to GitHub
