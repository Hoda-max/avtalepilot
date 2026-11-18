import {
  addDaysIso,
  advanceDueDateToPresent,
  leadDaysForRecurrence,
  todayIso,
} from "@/lib/dates";
import type { DateRecurrence } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function syncRemindersForDate(
  supabase: SupabaseClient,
  options: {
    organizationId: string;
    contractId: string;
    contractDateId: string;
    dueDate: string;
    recurrence: DateRecurrence;
    assigneeUserId: string | null;
  },
) {
  const today = todayIso();

  await supabase
    .from("reminders")
    .delete()
    .eq("contract_date_id", options.contractDateId)
    .eq("status", "pending");

  const leads = leadDaysForRecurrence(options.recurrence);
  const rows = leads
    .map((leadDays) => {
      const reminderDue = addDaysIso(options.dueDate, -leadDays);
      return {
        organization_id: options.organizationId,
        contract_id: options.contractId,
        contract_date_id: options.contractDateId,
        assignee_user_id: options.assigneeUserId,
        due_date: reminderDue,
        lead_days: leadDays,
        status: "pending" as const,
        email_sent_at: null,
        email_error: null,
      };
    })
    .filter((row) => row.due_date <= options.dueDate)
    .filter((row) => row.due_date >= addDaysIso(today, -7));

  if (rows.length === 0) {
    return;
  }

  await supabase.from("reminders").upsert(rows, {
    onConflict: "contract_date_id,lead_days",
  });
}

/** Advance past recurring contract dates and rebuild their reminders. */
export async function rollForwardRecurringDates(
  supabase: SupabaseClient,
  options?: { organizationId?: string },
) {
  const today = todayIso();

  let query = supabase
    .from("contract_dates")
    .select(
      "id, organization_id, contract_id, due_date, recurrence, contracts(owner_user_id)",
    )
    .neq("recurrence", "one_time")
    .lt("due_date", today)
    .limit(100);

  if (options?.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  const { data, error } = await query;
  if (error || !data?.length) {
    return { advanced: 0, error: error?.message };
  }

  let advanced = 0;

  for (const row of data) {
    const recurrence = row.recurrence as DateRecurrence;
    const nextDue = advanceDueDateToPresent(row.due_date, recurrence, today);
    if (nextDue === row.due_date) continue;

    const owner =
      row.contracts &&
      typeof row.contracts === "object" &&
      "owner_user_id" in row.contracts
        ? ((row.contracts as { owner_user_id: string | null }).owner_user_id ??
          null)
        : null;

    const { error: updateError } = await supabase
      .from("contract_dates")
      .update({ due_date: nextDue })
      .eq("id", row.id);

    if (updateError) continue;

    await syncRemindersForDate(supabase, {
      organizationId: row.organization_id,
      contractId: row.contract_id,
      contractDateId: row.id,
      dueDate: nextDue,
      recurrence,
      assigneeUserId: owner,
    });

    advanced += 1;
  }

  return { advanced };
}
