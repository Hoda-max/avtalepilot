import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireProfile } from "@/lib/auth/profile";
import { updateReminderStatus } from "@/app/contracts/date-actions";
import { formatDateNb } from "@/lib/dates";
import { fillTemplate, getDictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import type {
  ContractDate,
  ContractDateType,
  ReminderWithContract,
} from "@/lib/types";

export const instant = false;

type UpcomingDate = ContractDate & {
  contracts: { id: string; title: string } | null;
};

export default async function DashboardPage() {
  const { locale, dictionary } = await getDictionary();
  const { user, profile } = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + 90);
  const horizonIso = horizon.toISOString().slice(0, 10);

  const [
    { count: contractCount },
    { count: supplierCount },
    { data: upcomingData },
    { data: remindersData },
  ] = await Promise.all([
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id),
    supabase
      .from("suppliers")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id),
    supabase
      .from("contract_dates")
      .select("*, contracts(id, title)")
      .eq("organization_id", profile.organization_id)
      .gte("due_date", today)
      .lte("due_date", horizonIso)
      .order("due_date", { ascending: true })
      .limit(8),
    supabase
      .from("reminders")
      .select(
        "*, contracts(id, title), contract_dates(id, date_type, due_date)",
      )
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending")
      .lte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(10),
  ]);

  const upcoming = (upcomingData ?? []) as UpcomingDate[];
  const reminders = (remindersData ?? []) as ReminderWithContract[];

  const dateLabel = (type: ContractDateType) => {
    if (type === "notice") return dictionary.contracts.dates.notice;
    if (type === "renewal") return dictionary.contracts.dates.renewal;
    return dictionary.contracts.dates.expiry;
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader profile={profile} dictionary={dictionary} locale={locale} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {dictionary.dashboard.title}
        </h1>
        <p className="mt-2 text-slate-600">
          {fillTemplate(dictionary.dashboard.greeting, {
            name: profile.full_name ?? dictionary.dashboard.userFallback,
          })}{" "}
          <strong>{profile.organizations.name}</strong>.
        </p>

        <section className="mt-8 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {dictionary.dashboard.yourUser}
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">{dictionary.dashboard.email}</dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{dictionary.dashboard.role}</dt>
              <dd className="font-medium text-slate-900">
                {profile.role === "admin"
                  ? dictionary.dashboard.admin
                  : dictionary.dashboard.member}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link
            href="/contracts"
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-200 hover:bg-teal-50"
          >
            <p className="text-sm font-medium text-slate-500">
              {dictionary.dashboard.contracts}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {contractCount ?? 0}
            </p>
          </Link>
          <Link
            href="/suppliers"
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-200 hover:bg-teal-50"
          >
            <p className="text-sm font-medium text-slate-500">
              {dictionary.dashboard.suppliers}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {supplierCount ?? 0}
            </p>
          </Link>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">
              {dictionary.dashboard.openReminders}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {reminders.length}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {dictionary.dashboard.needsAttention}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {dictionary.dashboard.needsAttentionHelp}
            </p>
            <ul className="mt-4 space-y-3">
              {reminders.length === 0 ? (
                <li className="text-sm text-slate-500">
                  {dictionary.dashboard.noReminders}
                </li>
              ) : (
                reminders.map((reminder) => (
                  <li
                    key={reminder.id}
                    className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 text-sm"
                  >
                    <Link
                      href={`/contracts/${reminder.contract_id}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {reminder.contracts?.title ??
                        dictionary.dashboard.contractFallback}
                    </Link>
                    <p className="mt-1 text-slate-700">
                      {dateLabel(
                        (reminder.contract_dates?.date_type ??
                          "renewal") as ContractDateType,
                      )}{" "}
                      {formatDateNb(reminder.contract_dates?.due_date)} ·{" "}
                      {fillTemplate(dictionary.dashboard.daysBefore, {
                        days: reminder.lead_days,
                      })}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <form action={updateReminderStatus}>
                        <input type="hidden" name="id" value={reminder.id} />
                        <input type="hidden" name="status" value="done" />
                        <button
                          type="submit"
                          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          {dictionary.dashboard.done}
                        </button>
                      </form>
                      <form action={updateReminderStatus}>
                        <input type="hidden" name="id" value={reminder.id} />
                        <input type="hidden" name="status" value="dismissed" />
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          {dictionary.dashboard.dismiss}
                        </button>
                      </form>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {dictionary.dashboard.upcoming}
            </h2>
            <ul className="mt-4 space-y-3">
              {upcoming.length === 0 ? (
                <li className="text-sm text-slate-500">
                  {dictionary.dashboard.noUpcoming}
                </li>
              ) : (
                upcoming.map((item) => (
                  <li key={item.id} className="text-sm">
                    <Link
                      href={`/contracts/${item.contract_id}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {item.contracts?.title ??
                        dictionary.dashboard.contractFallback}
                    </Link>
                    <p className="text-slate-600">
                      {dateLabel(item.date_type as ContractDateType)} ·{" "}
                      {formatDateNb(item.due_date)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
