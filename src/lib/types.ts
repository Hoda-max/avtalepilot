export type UserRole = "admin" | "member";

export type Organization = {
  id: string;
  name: string;
  created_at: string;
};

export type Profile = {
  id: string;
  organization_id: string;
  full_name: string | null;
  email?: string | null;
  role: UserRole;
  created_at: string;
};

export type ProfileWithOrganization = Profile & {
  organizations: Organization;
};

export type Supplier = {
  id: string;
  organization_id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
};

export type ContractStatus = "draft" | "active" | "ended";

export type Contract = {
  id: string;
  organization_id: string;
  title: string;
  supplier_id: string | null;
  owner_user_id: string | null;
  department: string | null;
  location: string | null;
  cost: number | null;
  status: ContractStatus;
  notes: string | null;
  document_path: string | null;
  created_at: string;
  updated_at: string;
};

export type ContractWithRelations = Contract & {
  suppliers: Pick<Supplier, "id" | "name"> | null;
  profiles: Pick<Profile, "id" | "full_name"> | null;
};

export type ContractDateType = "renewal" | "expiry" | "notice";

export type ContractDate = {
  id: string;
  organization_id: string;
  contract_id: string;
  date_type: ContractDateType;
  due_date: string;
  created_at: string;
};

export type ReminderStatus = "pending" | "done" | "dismissed";

export type Reminder = {
  id: string;
  organization_id: string;
  contract_id: string;
  contract_date_id: string;
  assignee_user_id: string | null;
  due_date: string;
  lead_days: 90 | 30 | 7;
  status: ReminderStatus;
  created_at: string;
};

export type ReminderWithContract = Reminder & {
  contracts: Pick<Contract, "id" | "title"> | null;
  contract_dates: Pick<ContractDate, "id" | "date_type" | "due_date"> | null;
};

export type DecisionType = "renew" | "renegotiate" | "end";

export type Decision = {
  id: string;
  organization_id: string;
  contract_id: string;
  decision_type: DecisionType;
  decided_by: string | null;
  decided_at: string;
  note: string | null;
};

export type DecisionWithActor = Decision & {
  profiles: Pick<Profile, "id" | "full_name"> | null;
};
