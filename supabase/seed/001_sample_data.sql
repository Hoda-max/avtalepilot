-- AvtalePilot sample data (optional)
-- Run AFTER migrations 001–003 and after at least one user/profile exists.

do $$
declare
  org_id uuid;
  owner_id uuid;
  supplier_it uuid;
  supplier_lease uuid;
  contract_saas uuid;
  contract_office uuid;
  notice_date_id uuid;
begin
  select id into org_id
  from public.organizations
  order by created_at asc
  limit 1;

  if org_id is null then
    raise exception 'No organization found. Run migration 001 first and sign up a user.';
  end if;

  select id into owner_id
  from public.profiles
  where organization_id = org_id
  order by created_at asc
  limit 1;

  if owner_id is null then
    raise exception 'No profile found. Log in once after migration 001.';
  end if;

  insert into public.suppliers (organization_id, name, contact_email, notes)
  values (org_id, 'Nordic Soft AS', 'support@nordicsoft.example', 'Programvareleverandør')
  returning id into supplier_it;

  insert into public.suppliers (organization_id, name, contact_email, notes)
  values (org_id, 'Oslo Lokaler AS', 'leie@oslolokaler.example', 'Kontorleie')
  returning id into supplier_lease;

  insert into public.contracts (
    organization_id, title, supplier_id, owner_user_id,
    department, location, cost, status, notes
  )
  values (
    org_id,
    'Microsoft 365 abonnement',
    supplier_it,
    owner_id,
    'IT',
    'Hovedkontor',
    48000,
    'active',
    'Eksempelavtale for demo'
  )
  returning id into contract_saas;

  insert into public.contracts (
    organization_id, title, supplier_id, owner_user_id,
    department, location, cost, status, notes
  )
  values (
    org_id,
    'Kontorleie Storgata 1',
    supplier_lease,
    owner_id,
    'Drift',
    'Oslo',
    360000,
    'active',
    'Eksempel leieavtale'
  )
  returning id into contract_office;

  insert into public.contract_dates (organization_id, contract_id, date_type, due_date)
  values (org_id, contract_saas, 'notice', (current_date + 20))
  on conflict (contract_id, date_type) do update set due_date = excluded.due_date
  returning id into notice_date_id;

  insert into public.contract_dates (organization_id, contract_id, date_type, due_date)
  values
    (org_id, contract_saas, 'renewal', (current_date + 50)),
    (org_id, contract_office, 'expiry', (current_date + 120)),
    (org_id, contract_office, 'notice', (current_date + 90))
  on conflict (contract_id, date_type) do update
    set due_date = excluded.due_date;

  insert into public.reminders (
    organization_id, contract_id, contract_date_id,
    assignee_user_id, due_date, lead_days, status
  )
  values (
    org_id,
    contract_saas,
    notice_date_id,
    owner_id,
    current_date,
    7,
    'pending'
  )
  on conflict (contract_date_id, lead_days) do update
    set due_date = excluded.due_date,
        status = 'pending',
        assignee_user_id = excluded.assignee_user_id;

  insert into public.decisions (
    organization_id, contract_id, decision_type, decided_by, note
  )
  values (
    org_id,
    contract_saas,
    'renegotiate',
    owner_id,
    'Demo: vurder antall lisenser før fornyelse'
  );
end;
$$;
