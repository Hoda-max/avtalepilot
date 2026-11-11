-- AvtalePilot Phase 2: suppliers, contracts, document storage
-- Run once in Supabase → SQL Editor → New query → Run

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists suppliers_organization_id_idx
  on public.suppliers (organization_id);

create index if not exists suppliers_name_idx
  on public.suppliers (organization_id, name);

-- ---------------------------------------------------------------------------
-- Contracts
-- ---------------------------------------------------------------------------

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  owner_user_id uuid references public.profiles (id) on delete set null,
  department text,
  location text,
  cost numeric(14, 2),
  status text not null default 'active'
    check (status in ('draft', 'active', 'ended')),
  notes text,
  document_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contracts_organization_id_idx
  on public.contracts (organization_id);

create index if not exists contracts_supplier_id_idx
  on public.contracts (supplier_id);

create index if not exists contracts_owner_user_id_idx
  on public.contracts (owner_user_id);

create index if not exists contracts_status_idx
  on public.contracts (organization_id, status);

create or replace function public.set_contracts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at
  before update on public.contracts
  for each row
  execute function public.set_contracts_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.suppliers enable row level security;
alter table public.contracts enable row level security;

drop policy if exists "Org members can view suppliers" on public.suppliers;
create policy "Org members can view suppliers"
  on public.suppliers for select to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Org members can insert suppliers" on public.suppliers;
create policy "Org members can insert suppliers"
  on public.suppliers for insert to authenticated
  with check (organization_id = public.current_organization_id());

drop policy if exists "Org members can update suppliers" on public.suppliers;
create policy "Org members can update suppliers"
  on public.suppliers for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

drop policy if exists "Org members can delete suppliers" on public.suppliers;
create policy "Org members can delete suppliers"
  on public.suppliers for delete to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Org members can view contracts" on public.contracts;
create policy "Org members can view contracts"
  on public.contracts for select to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists "Org members can insert contracts" on public.contracts;
create policy "Org members can insert contracts"
  on public.contracts for insert to authenticated
  with check (organization_id = public.current_organization_id());

drop policy if exists "Org members can update contracts" on public.contracts;
create policy "Org members can update contracts"
  on public.contracts for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

drop policy if exists "Org members can delete contracts" on public.contracts;
create policy "Org members can delete contracts"
  on public.contracts for delete to authenticated
  using (organization_id = public.current_organization_id());

-- ---------------------------------------------------------------------------
-- Storage bucket for contract PDFs
-- Path format: {organization_id}/{contract_id}/{filename}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contract-documents',
  'contract-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Org members can read contract documents" on storage.objects;
create policy "Org members can read contract documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'contract-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );

drop policy if exists "Org members can upload contract documents" on storage.objects;
create policy "Org members can upload contract documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'contract-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );

drop policy if exists "Org members can update contract documents" on storage.objects;
create policy "Org members can update contract documents"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'contract-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  )
  with check (
    bucket_id = 'contract-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );

drop policy if exists "Org members can delete contract documents" on storage.objects;
create policy "Org members can delete contract documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'contract-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );
