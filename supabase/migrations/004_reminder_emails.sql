-- AvtalePilot: email reminders support
-- Run once in Supabase → SQL Editor → New query → Run

-- ---------------------------------------------------------------------------
-- Profile email (for reminder recipients)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  user_role text;
  org_count integer;
begin
  select count(*) into org_count from public.organizations;

  if org_count = 0 then
    insert into public.organizations (name)
    values ('Min organisasjon')
    returning id into org_id;
    user_role := 'admin';
  else
    select id into org_id
    from public.organizations
    order by created_at asc
    limit 1;
    user_role := 'member';
  end if;

  insert into public.profiles (id, organization_id, full_name, role, email)
  values (
    new.id,
    org_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    user_role,
    new.email
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reminder email tracking
-- ---------------------------------------------------------------------------

alter table public.reminders
  add column if not exists email_sent_at timestamptz;

alter table public.reminders
  add column if not exists email_error text;

create index if not exists reminders_due_email_idx
  on public.reminders (organization_id, status, due_date)
  where email_sent_at is null;
