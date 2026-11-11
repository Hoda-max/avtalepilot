"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  sendDueReminderEmailsAction,
  type ReminderEmailState,
} from "./reminder-email-actions";

const initialState: ReminderEmailState = {};

type ReminderEmailPanelProps = {
  dictionary: Dictionary;
  isAdmin: boolean;
};

export function ReminderEmailPanel({
  dictionary,
  isAdmin,
}: ReminderEmailPanelProps) {
  const [state, action, pending] = useActionState(
    sendDueReminderEmailsAction,
    initialState,
  );

  if (!isAdmin) {
    return null;
  }

  const t = dictionary.settings.emails;

  return (
    <section className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.help}</p>
      <p className="mt-2 text-sm text-slate-500">{t.note}</p>

      <form action={action} className="mt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {pending ? t.sending : t.sendNow}
        </button>
      </form>

      {state.error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.result ? (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700">
          <p className="font-medium">{state.result.message}</p>
          {state.result.details.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              {state.result.details.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
