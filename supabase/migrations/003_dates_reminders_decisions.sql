-- AvtalePilot Phase 3: key dates, reminders, decisions
-- Run once in Supabase → SQL Editor → New query → Run

-- ---------------------------------------------------------------------------
-- Contract dates
-- ---------------------------------------------------------------------------

create table if not exists public.contract_dates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  date_type text not null check (date_type in ('renewal', 'expiry', 'notice')),
  due_date date not null,
  created_at timestamptz not null default now(),
  unique (contract_id, date_type)
);

create index if not exists contract_dates_org_due_idx
  on public.contract_dates (organization_id, due_date);

create index if not exists contract_dates_contract_idx
  on public.contract_dates (contract_id);

-- ---------------------------------------------------------------------------
-- Reminders
-- ---------------------------------------------------------------------------

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  contract_date_id uuid not null references public.contract_dates (id) on delete cascade,
  assignee_user_id uuid references public.profiles (id) on delete set null,
  due_date date not null,
  lead_days integer not null check (lead_days in (90, 30, 7)),
  status text not null default 'pending'
    check (status in ('pending', 'done', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (contract_date_id, lead_days)
);

create index if not exists reminders_org_status_due_idx
  on public.reminders (organization_id, status, due_date);

create index if not exists reminders_assignee_idx
  on public.reminders (assignee_user_id, status);

-- ---------------------------------------------------------------------------
-- Decisions
-- ---------------------------------------------------------------------------

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  decision_type text not null check (decision_type in ('renew', 'renegotiate', 'end')),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz not null default now(),
  note text
);

create index if not exists decisions_contract_idx
  on public.decisions (contract_id, decided_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.contract_dates enable row level security;
alter table public.reminders enable row level security;
alter table public.decisions enable row level security;

drop policy if exists "Org members can view contract dates" on public.contract_dates;
create policy "Org members can view contract dates"
  on public.contract_dates for select to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Org members can insert contract dates" on public.contract_dates;
create policy "Org members can insert contract dates"
  on public.contract_dates for insert to authenticated
  with check (organization_id = public.current_organization_id());

drop policy if exists "Org members can update contract dates" on public.contract_dates;
create policy "Org members can update contract dates"
  on public.contract_dates for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

drop policy if exists "Org members can delete contract dates" on public.contract_dates;
create policy "Org members can delete contract dates"
  on public.contract_dates for delete to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Org members can view reminders" on public.reminders;
create policy "Org members can view reminders"
  on public.reminders for select to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Org members can insert reminders" on public.reminders;
create policy "Org members can insert reminders"
  on public.reminders for insert to authenticated
  with check (organization_id = public.current_organization_id());

drop policy if exists "Org members can update reminders" on public.reminders;
create policy "Org members can update reminders"
  on public.reminders for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

drop policy if exists "Org members can delete reminders" on public.reminders;
create policy "Org members can delete reminders"
  on public.reminders for delete to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Org members can view decisions" on public.decisions;
create policy "Org members can view decisions"
  on public.decisions for select to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Org members can insert decisions" on public.decisions;
create policy "Org members can insert decisions"
  on public.decisions for insert to authenticated
  with check (organization_id = public.current_organization_id());
