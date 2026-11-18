"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/profile";
import { isDateRecurrence } from "@/lib/dates";
import { syncRemindersForDate } from "@/lib/reminders/sync-reminders";
import { createClient } from "@/lib/supabase/server";
import type {
  ContractDateType,
  DateRecurrence,
  DecisionType,
  ReminderStatus,
} from "@/lib/types";

export type DateActionState = {
  error?: string;
  message?: string;
};

export async function upsertContractDate(
  _prevState: DateActionState,
  formData: FormData,
): Promise<DateActionState> {
  const { profile } = await requireProfile();
  const contractId = String(formData.get("contract_id") ?? "");
  const dateType = String(formData.get("date_type") ?? "") as ContractDateType;
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const recurrenceRaw = String(formData.get("recurrence") ?? "one_time").trim();
  const recurrence: DateRecurrence = isDateRecurrence(recurrenceRaw)
    ? recurrenceRaw
    : "one_time";

  if (!contractId || !dueDate) {
    return { error: "Velg type og dato." };
  }

  if (!["renewal", "expiry", "notice"].includes(dateType)) {
    return { error: "Ugyldig datotype." };
  }

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, owner_user_id")
    .eq("id", contractId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (!contract) {
    return { error: "Fant ikke avtalen." };
  }

  const { data: saved, error } = await supabase
    .from("contract_dates")
    .upsert(
      {
        organization_id: profile.organization_id,
        contract_id: contractId,
        date_type: dateType,
        due_date: dueDate,
        recurrence,
      },
      { onConflict: "contract_id,date_type" },
    )
    .select("id, due_date, recurrence")
    .single();

  if (error || !saved) {
    return { error: `Kunne ikke lagre dato: ${error?.message}` };
  }

  await syncRemindersForDate(supabase, {
    organizationId: profile.organization_id,
    contractId,
    contractDateId: saved.id,
    dueDate: saved.due_date,
    recurrence: (saved.recurrence as DateRecurrence) ?? recurrence,
    assigneeUserId: contract.owner_user_id,
  });

  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/dashboard");
  return { message: "Dato og påminnelser er lagret." };
}

export async function deleteContractDate(formData: FormData) {
  const { profile } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const contractId = String(formData.get("contract_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("contract_dates")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/dashboard");
}

export async function createDecision(
  _prevState: DateActionState,
  formData: FormData,
): Promise<DateActionState> {
  const { profile } = await requireProfile();
  const contractId = String(formData.get("contract_id") ?? "");
  const decisionType = String(formData.get("decision_type") ?? "") as DecisionType;
  const note = String(formData.get("note") ?? "").trim();

  if (!contractId || !["renew", "renegotiate", "end"].includes(decisionType)) {
    return { error: "Velg en gyldig beslutning." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("decisions").insert({
    organization_id: profile.organization_id,
    contract_id: contractId,
    decision_type: decisionType,
    decided_by: profile.id,
    note: note || null,
  });

  if (error) {
    return { error: `Kunne ikke lagre beslutning: ${error.message}` };
  }

  if (decisionType === "end") {
    await supabase
      .from("contracts")
      .update({ status: "ended" })
      .eq("id", contractId)
      .eq("organization_id", profile.organization_id);
  }

  if (decisionType === "renew") {
    await supabase
      .from("contracts")
      .update({ status: "active" })
      .eq("id", contractId)
      .eq("organization_id", profile.organization_id);
  }

  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/contracts");
  revalidatePath("/dashboard");
  return { message: "Beslutningen er registrert." };
}

export async function updateReminderStatus(formData: FormData) {
  const { profile } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ReminderStatus;

  if (!id || !["done", "dismissed", "pending"].includes(status)) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("reminders")
    .update({ status })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  revalidatePath("/dashboard");
}
