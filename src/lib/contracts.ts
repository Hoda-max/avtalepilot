import type { ContractStatus } from "@/lib/types";

export const CONTRACT_STATUSES: { value: ContractStatus; label: string }[] = [
  { value: "draft", label: "Utkast" },
  { value: "active", label: "Aktiv" },
  { value: "ended", label: "Avsluttet" },
];

export function contractStatusLabel(status: ContractStatus) {
  return CONTRACT_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function formatNok(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
