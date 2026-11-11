-- AvtalePilot Phase 1: organizations + profiles (ready for many orgs later)
-- Run this once in Supabase → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  full_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_organization_id_idx
  on public.profiles (organization_id);

-- ---------------------------------------------------------------------------
-- Helpers (used by RLS)
-- ---------------------------------------------------------------------------

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Auto-create profile when a new auth user signs up
-- First user in an empty system becomes admin of a default org.
-- Later users join the first organization as members (MVP: one org).
-- ---------------------------------------------------------------------------

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

  insert into public.profiles (id, organization_id, full_name, role)
  values (
    new.id,
    org_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    user_role
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Backfill: existing users (created before this migration)
-- ---------------------------------------------------------------------------

do $$
declare
  org_id uuid;
  existing_count integer;
begin
  select count(*) into existing_count from public.organizations;

  if existing_count = 0 then
    insert into public.organizations (name)
    values ('Min organisasjon')
    returning id into org_id;
  else
    select id into org_id
    from public.organizations
    order by created_at asc
    limit 1;
  end if;

  insert into public.profiles (id, organization_id, full_name, role)
  select
    u.id,
    org_id,
    split_part(u.email, '@', 1),
    'member'
  from auth.users u
  where not exists (
    select 1 from public.profiles p where p.id = u.id
  );
end;
$$;

-- Oldest profile becomes admin if the org has none yet
update public.profiles
set role = 'admin'
where id = (
  select id from public.profiles order by created_at asc limit 1
)
and not exists (
  select 1 from public.profiles where role = 'admin'
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can view their organization" on public.organizations;
create policy "Users can view their organization"
  on public.organizations
  for select
  to authenticated
  using (id = public.current_organization_id());

drop policy if exists "Admins can update their organization" on public.organizations;
create policy "Admins can update their organization"
  on public.organizations
  for update
  to authenticated
  using (
    id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  )
  with check (
    id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "Users can view profiles in their organization" on public.profiles;
create policy "Users can view profiles in their organization"
  on public.profiles
  for select
  to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and organization_id = public.current_organization_id()
  );
