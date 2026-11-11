import type { ContractDateType, DecisionType } from "@/lib/types";

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

export const REMINDER_LEAD_DAYS = [90, 30, 7] as const;

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
