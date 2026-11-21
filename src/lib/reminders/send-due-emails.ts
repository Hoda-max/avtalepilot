import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { todayIso } from "@/lib/dates";
import { rollForwardRecurringDates } from "@/lib/reminders/sync-reminders";
import { createClient } from "@/lib/supabase/server";
import type { ContractDateType } from "@/lib/types";

export type SendDueEmailsResult = {
  ok: boolean;
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
  message: string;
  details: string[];
};

type DueReminderRow = {
  id: string;
  due_date: string;
  lead_days: number;
  assignee_user_id: string | null;
  contracts: { id: string; title: string } | null;
  contract_dates: {
    date_type: ContractDateType;
    due_date: string;
  } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

function dateTypeLabelNb(type: ContractDateType | undefined) {
  switch (type) {
    case "notice":
      return "Oppsigelsesfrist";
    case "renewal":
      return "Fornyelse";
    case "expiry":
      return "Utløp";
    default:
      return "Frist";
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendDueReminderEmails(options?: {
  organizationId?: string;
  /** Prefer service-role client for Vercel Cron (no user session / RLS). */
  supabase?: SupabaseClient;
}): Promise<SendDueEmailsResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "AvtalePilot <onboarding@resend.dev>";
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  if (!apiKey) {
    return {
      ok: false,
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      message:
        "RESEND_API_KEY is missing. Add it to .env.local and restart the app.",
      details: [],
    };
  }

  const supabase = options?.supabase ?? (await createClient());
  const today = todayIso();

  let query = supabase
    .from("reminders")
    .select(
      "id, due_date, lead_days, assignee_user_id, contracts(id, title), contract_dates(date_type, due_date), profiles!reminders_assignee_user_id_fkey(full_name, email)",
    )
    .eq("status", "pending")
    .lte("due_date", today)
    .is("email_sent_at", null)
    .order("due_date", { ascending: true })
    .limit(50);

  if (options?.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  const { data, error } = await query;

  if (error) {
    return {
      ok: false,
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      message: `Could not load reminders: ${error.message}`,
      details: [],
    };
  }

  const reminders = (data ?? []) as unknown as DueReminderRow[];
  const resend = new Resend(apiKey);

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const details: string[] = [];

  for (const reminder of reminders) {
    const email = reminder.profiles?.email?.trim();
    const contractTitle = reminder.contracts?.title ?? "Avtale";
    const contractId = reminder.contracts?.id;
    const deadlineType = dateTypeLabelNb(reminder.contract_dates?.date_type);
    const deadlineDate = reminder.contract_dates?.due_date ?? reminder.due_date;
    const safeTitle = escapeHtml(contractTitle);
    const safeName = escapeHtml(reminder.profiles?.full_name?.trim() ?? "");

    if (!email) {
      skipped += 1;
      details.push(`${contractTitle}: no assignee email`);
      await supabase
        .from("reminders")
        .update({ email_error: "No assignee email on profile" })
        .eq("id", reminder.id);
      continue;
    }

    const link = contractId
      ? `${appUrl}/contracts/${contractId}`
      : `${appUrl}/dashboard`;

    const subject = `AvtalePilot-påminnelse: ${contractTitle}`;
    const leadLabel =
      reminder.lead_days === 0
        ? "samme dag"
        : `${reminder.lead_days} dager før`;
    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111827">
        <p>Hei${safeName ? ` ${safeName}` : ""},</p>
        <p>
          En avtale-frist trenger oppfølging:
        </p>
        <ul>
          <li><strong>Avtale:</strong> ${safeTitle}</li>
          <li><strong>Type:</strong> ${deadlineType}</li>
          <li><strong>Frist:</strong> ${escapeHtml(deadlineDate)}</li>
          <li><strong>Påminnelse:</strong> ${leadLabel}</li>
        </ul>
        <p>
          <a href="${link}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">
            Åpne avtale
          </a>
        </p>
        <p style="color:#6b7280;font-size:12px">Sendt av AvtalePilot</p>
      </div>
    `;

    try {
      const { error: sendError } = await resend.emails.send({
        from,
        to: email,
        subject,
        html,
      });

      if (sendError) {
        failed += 1;
        details.push(`${contractTitle} → ${email}: ${sendError.message}`);
        await supabase
          .from("reminders")
          .update({ email_error: sendError.message })
          .eq("id", reminder.id);
        continue;
      }

      sent += 1;
      details.push(`${contractTitle} → ${email}: sent`);
      await supabase
        .from("reminders")
        .update({
          email_sent_at: new Date().toISOString(),
          email_error: null,
        })
        .eq("id", reminder.id);
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "Unknown send error";
      details.push(`${contractTitle} → ${email}: ${message}`);
      await supabase
        .from("reminders")
        .update({ email_error: message })
        .eq("id", reminder.id);
    }
  }

  const rolled = await rollForwardRecurringDates(supabase, {
    organizationId: options?.organizationId,
  });
  if (rolled.advanced) {
    details.push(`Advanced ${rolled.advanced} recurring date(s).`);
  }

  return {
    ok: failed === 0,
    scanned: reminders.length,
    sent,
    skipped,
    failed,
    message:
      reminders.length === 0
        ? rolled.advanced
          ? `No due reminder emails. Advanced ${rolled.advanced} recurring date(s).`
          : "No due reminders waiting for email."
        : `Scanned ${reminders.length}: sent ${sent}, skipped ${skipped}, failed ${failed}.`,
    details,
  };
}
