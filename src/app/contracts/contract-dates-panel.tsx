"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDateNb } from "@/lib/dates";
import type {
  ContractDate,
  ContractDateType,
  DateRecurrence,
  DecisionType,
  DecisionWithActor,
} from "@/lib/types";
import {
  createDecision,
  deleteContractDate,
  upsertContractDate,
  type DateActionState,
} from "./date-actions";

const initialState: DateActionState = {};

type ContractDatesPanelProps = {
  contractId: string;
  dates: ContractDate[];
  decisions: DecisionWithActor[];
  dictionary: Dictionary;
};

export function ContractDatesPanel({
  contractId,
  dates,
  decisions,
  dictionary,
}: ContractDatesPanelProps) {
  const [dateState, dateAction, datePending] = useActionState(
    upsertContractDate,
    initialState,
  );
  const [decisionState, decisionAction, decisionPending] = useActionState(
    createDecision,
    initialState,
  );

  const dateLabel = (type: ContractDateType) => {
    if (type === "notice") return dictionary.contracts.dates.notice;
    if (type === "renewal") return dictionary.contracts.dates.renewal;
    return dictionary.contracts.dates.expiry;
  };

  const decisionLabel = (type: DecisionType) => {
    if (type === "renew") return dictionary.contracts.decisions.renew;
    if (type === "renegotiate") return dictionary.contracts.decisions.renegotiate;
    return dictionary.contracts.decisions.end;
  };

  const recurrenceLabel = (value: DateRecurrence | undefined) => {
    switch (value) {
      case "daily":
        return dictionary.contracts.dates.daily;
      case "weekly":
        return dictionary.contracts.dates.weekly;
      case "monthly":
        return dictionary.contracts.dates.monthly;
      case "yearly":
        return dictionary.contracts.dates.yearly;
      case "one_time":
      default:
        return dictionary.contracts.dates.oneTime;
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {dictionary.contracts.dates.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {dictionary.contracts.dates.help}
        </p>

        <ul className="mt-4 space-y-2">
          {dates.length === 0 ? (
            <li className="text-sm text-slate-500">
              {dictionary.contracts.dates.none}
            </li>
          ) : (
            dates.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <span>
                  <strong>{dateLabel(item.date_type as ContractDateType)}</strong>
                  {": "}
                  {formatDateNb(item.due_date)}
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {recurrenceLabel(item.recurrence)}
                  </span>
                </span>
                <form action={deleteContractDate}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="contract_id" value={contractId} />
                  <button type="submit" className="text-red-700 hover:underline">
                    {dictionary.contracts.dates.delete}
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>

        <form action={dateAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="contract_id" value={contractId} />
          <select
            name="date_type"
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
          >
            <option value="notice">{dictionary.contracts.dates.notice}</option>
            <option value="renewal">{dictionary.contracts.dates.renewal}</option>
            <option value="expiry">{dictionary.contracts.dates.expiry}</option>
          </select>
          <input
            type="date"
            name="due_date"
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
          />
          <select
            name="recurrence"
            required
            aria-label={dictionary.contracts.dates.recurrence}
            defaultValue="one_time"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2 sm:col-span-2"
          >
            <option value="one_time">
              {dictionary.contracts.dates.oneTime}
            </option>
            <option value="daily">{dictionary.contracts.dates.daily}</option>
            <option value="weekly">{dictionary.contracts.dates.weekly}</option>
            <option value="monthly">{dictionary.contracts.dates.monthly}</option>
            <option value="yearly">{dictionary.contracts.dates.yearly}</option>
          </select>
          <button
            type="submit"
            disabled={datePending}
            className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 sm:col-span-2"
          >
            {datePending
              ? dictionary.contracts.dates.saving
              : dictionary.contracts.dates.save}
          </button>
        </form>
        {dateState.error ? (
          <p className="mt-2 text-sm text-red-700">{dateState.error}</p>
        ) : null}
        {dateState.message ? (
          <p className="mt-2 text-sm text-teal-800">{dateState.message}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {dictionary.contracts.decisions.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {dictionary.contracts.decisions.help}
        </p>

        <form action={decisionAction} className="mt-4 space-y-3">
          <input type="hidden" name="contract_id" value={contractId} />
          <select
            name="decision_type"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
          >
            <option value="renew">{dictionary.contracts.decisions.renew}</option>
            <option value="renegotiate">
              {dictionary.contracts.decisions.renegotiate}
            </option>
            <option value="end">{dictionary.contracts.decisions.end}</option>
          </select>
          <textarea
            name="note"
            rows={3}
            placeholder={dictionary.contracts.decisions.notePlaceholder}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
          />
          <button
            type="submit"
            disabled={decisionPending}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {decisionPending
              ? dictionary.contracts.decisions.saving
              : dictionary.contracts.decisions.save}
          </button>
        </form>
        {decisionState.error ? (
          <p className="mt-2 text-sm text-red-700">{decisionState.error}</p>
        ) : null}
        {decisionState.message ? (
          <p className="mt-2 text-sm text-teal-800">{decisionState.message}</p>
        ) : null}

        <ul className="mt-6 space-y-3 border-t border-slate-100 pt-4">
          {decisions.length === 0 ? (
            <li className="text-sm text-slate-500">
              {dictionary.contracts.decisions.none}
            </li>
          ) : (
            decisions.map((decision) => (
              <li key={decision.id} className="text-sm text-slate-700">
                <strong>
                  {decisionLabel(decision.decision_type as DecisionType)}
                </strong>
                {" · "}
                {formatDateNb(decision.decided_at.slice(0, 10))}
                {" · "}
                {decision.profiles?.full_name ??
                  dictionary.contracts.decisions.unknown}
                {decision.note ? (
                  <span className="mt-1 block text-slate-500">{decision.note}</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
