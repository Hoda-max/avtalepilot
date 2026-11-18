import type {
  ContractDateType,
  DateRecurrence,
  DecisionType,
  ReminderLeadDays,
} from "@/lib/types";

export const DATE_TYPES: { value: ContractDateType; label: string }[] = [
  { value: "notice", label: "Oppsigelsesfrist" },
  { value: "renewal", label: "Fornyelse" },
  { value: "expiry", label: "Utløp" },
];

export const DECISION_TYPES: { value: DecisionType; label: string }[] = [
  { value: "renew", label: "Fornye" },
  { value: "renegotiate", label: "Omforhandle" },
  { value: "end", label: "Avslutte" },
];

export const DATE_RECURRENCES: DateRecurrence[] = [
  "one_time",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

export const REMINDER_LEAD_DAYS = [90, 30, 7] as const;

export function isDateRecurrence(value: string): value is DateRecurrence {
  return (DATE_RECURRENCES as string[]).includes(value);
}

/** Lead times that make sense for the recurrence interval. */
export function leadDaysForRecurrence(
  recurrence: DateRecurrence,
): ReminderLeadDays[] {
  switch (recurrence) {
    case "daily":
      return [0];
    case "weekly":
      return [1];
    case "monthly":
      return [7];
    case "yearly":
    case "one_time":
    default:
      return [90, 30, 7];
  }
}

export function nextDueDate(isoDate: string, recurrence: DateRecurrence) {
  if (recurrence === "one_time") return isoDate;

  const date = new Date(`${isoDate}T00:00:00Z`);

  if (recurrence === "daily") {
    date.setUTCDate(date.getUTCDate() + 1);
  } else if (recurrence === "weekly") {
    date.setUTCDate(date.getUTCDate() + 7);
  } else if (recurrence === "monthly") {
    const day = date.getUTCDate();
    date.setUTCMonth(date.getUTCMonth() + 1, 1);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
  } else if (recurrence === "yearly") {
    const day = date.getUTCDate();
    date.setUTCFullYear(date.getUTCFullYear() + 1);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
  }

  return date.toISOString().slice(0, 10);
}

/** Move a past recurring due date forward until it is today or later. */
export function advanceDueDateToPresent(
  isoDate: string,
  recurrence: DateRecurrence,
  today: string = todayIso(),
) {
  if (recurrence === "one_time") return isoDate;

  let current = isoDate;
  for (let i = 0; i < 4000 && current < today; i += 1) {
    current = nextDueDate(current, recurrence);
  }
  return current;
}

export function dateTypeLabel(type: ContractDateType) {
  return DATE_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function decisionTypeLabel(type: DecisionType) {
  return DECISION_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function formatDateNb(
  value: string | null | undefined,
  locale: string = "nb",
) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const localeTag =
    locale === "ar" ? "ar" : locale === "en" ? "en-GB" : "nb-NO";

  return new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function addDaysIso(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
