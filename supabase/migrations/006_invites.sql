-- AvtalePilot: email invites + stop auto-join + admin role updates
-- Run once in Supabase → SQL Editor → New query → Run

-- ---------------------------------------------------------------------------
-- Invites
-- ---------------------------------------------------------------------------

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  token text not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invites_organization_id_idx
  on public.invites (organization_id);

create index if not exists invites_email_idx
  on public.invites (lower(email));

create index if not exists invites_token_idx
  on public.invites (token);

alter table public.invites enable row level security;

drop policy if exists "Members can view invites in their organization" on public.invites;
create policy "Members can view invites in their organization"
  on public.invites
  for select
  to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Admins can create invites" on public.invites;
create policy "Admins can create invites"
  on public.invites
  for insert
  to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "Admins can update invites" on public.invites;
create policy "Admins can update invites"
  on public.invites
  for update
  to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "Admins can delete invites" on public.invites;
create policy "Admins can delete invites"
  on public.invites
  for delete
  to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

-- ---------------------------------------------------------------------------
-- Signup: only bootstrap first org; later users wait for an invite
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  org_count integer;
begin
  select count(*) into org_count from public.organizations;

  if org_count = 0 then
    insert into public.organizations (name)
    values ('Min organisasjon')
    returning id into org_id;

    insert into public.profiles (id, organization_id, full_name, role, email)
    values (
      new.id,
      org_id,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      'admin',
      new.email
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: users cannot change their own role; admins can update org members
-- ---------------------------------------------------------------------------

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and organization_id = public.current_organization_id()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "Admins can update profiles in their organization" on public.profiles;
create policy "Admins can update profiles in their organization"
  on public.profiles
  for update
  to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );
