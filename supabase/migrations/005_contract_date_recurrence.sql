-- AvtalePilot: recurring key dates (one_time / daily / weekly / monthly / yearly)
-- Run once in Supabase → SQL Editor → New query → Run

alter table public.contract_dates
  add column if not exists recurrence text not null default 'one_time'
    check (recurrence in ('one_time', 'daily', 'weekly', 'monthly', 'yearly'));

-- Allow short-cycle reminder leads (0 = on the day, 1 = day before).
alter table public.reminders drop constraint if exists reminders_lead_days_check;
alter table public.reminders
  add constraint reminders_lead_days_check
  check (lead_days in (0, 1, 7, 30, 90));
