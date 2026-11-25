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
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

Use the **Project URL**, the long **anon/public** key, and the **service_role** key from Supabase → Project Settings → API.  
The URL must end with `.supabase.co` (nothing after it).  
Never put `SUPABASE_SERVICE_ROLE_KEY` in client code or commit it.

4. Run database setup in Supabase **SQL Editor** (in order):

- `supabase/migrations/001_organizations_profiles.sql`
- `supabase/migrations/002_suppliers_contracts.sql`
- `supabase/migrations/003_dates_reminders_decisions.sql`
- `supabase/migrations/004_reminder_emails.sql`
- `supabase/migrations/005_contract_date_recurrence.sql`
- `supabase/migrations/006_invites.sql`

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
- Email invites (admin sends invite; new users join via link)
- Role management in Settings (promote/demote; last-admin protected)
- Suppliers and contracts (search + filters)
- Upload contract PDF/image
- Key dates + recurrence (one-time / daily / weekly / monthly / yearly)
- Automatic reminders (lead times depend on recurrence)
- Decisions: renew / renegotiate / end
- Dashboard of open reminders and upcoming deadlines
- Email reminders via Resend (manual from Settings + daily Vercel Cron)

## Invites

1. Run `supabase/migrations/006_invites.sql` in Supabase SQL Editor.
2. Ensure `RESEND_API_KEY`, `EMAIL_FROM`, and `NEXT_PUBLIC_APP_URL` (or `APP_URL`) are set so invite emails include a working link.
3. As an **admin**, open **Settings → People and roles**, enter an email + role, and send the invite.
4. The invitee opens the link, signs up or logs in with that email, and accepts.

After `006`, new signups no longer auto-join your org; they need an invite (except the very first user when the database has no organization).

## Email reminders (Resend)

1. Create a free account at [https://resend.com](https://resend.com)
2. Create an API key
3. Add to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=AvtalePilot <onboarding@resend.dev>
CRON_SECRET=change-me-to-a-long-random-string
REMINDER_CRON_SECRET=change-me-to-a-long-random-string
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

4. Run `supabase/migrations/004_reminder_emails.sql` in Supabase (and `005` for recurrence, `006` for invites)
5. Restart `npm run dev`
6. Make sure a reminder is due today (or use sample data)
7. Go to **Settings** → **Send due reminders now**

### Automatic daily emails (Vercel Cron)

After deploy, Vercel runs `/api/reminders/send` every day at **07:00 UTC** (`vercel.json`).  
“Today” for due reminders uses **Europe/Oslo**.

In Vercel → Project → **Environment Variables**, set:

- `SUPABASE_SERVICE_ROLE_KEY` = Supabase **service_role** secret (required so cron can read reminders without a logged-in user)
- `CRON_SECRET` = a long random string (Vercel Cron sends `Authorization: Bearer …`)
- You can use the same value for `REMINDER_CRON_SECRET`
- `NEXT_PUBLIC_APP_URL` = your live URL, e.g. `https://avtalepilot.vercel.app`
- Plus Resend vars: `RESEND_API_KEY`, `EMAIL_FROM`

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
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `CRON_SECRET`
   - `REMINDER_CRON_SECRET` (optional if same as `CRON_SECRET`)
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
