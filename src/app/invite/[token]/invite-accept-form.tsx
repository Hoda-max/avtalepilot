"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { acceptInvite, type AcceptInviteState } from "./actions";

const initialState: AcceptInviteState = {};

type InviteAcceptFormProps = {
  token: string;
  inviteEmail: string;
  organizationName: string;
  roleLabel: string;
  dictionary: Dictionary;
  loggedInEmail: string | null;
};

export function InviteAcceptForm({
  token,
  inviteEmail,
  organizationName,
  roleLabel,
  dictionary,
  loggedInEmail,
}: InviteAcceptFormProps) {
  const t = dictionary.invite;
  const [state, action, pending] = useActionState(acceptInvite, initialState);
  const nextPath = `/invite/${token}`;
  const emailMatches =
    loggedInEmail &&
    loggedInEmail.trim().toLowerCase() === inviteEmail.trim().toLowerCase();

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        {dictionary.brand}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{t.title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {t.invitedTo
          .replace("{org}", organizationName)
          .replace("{role}", roleLabel)}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        {t.forEmail}: <strong>{inviteEmail}</strong>
      </p>

      {loggedInEmail && !emailMatches ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t.wrongAccount
            .replace("{current}", loggedInEmail)
            .replace("{expected}", inviteEmail)}
        </p>
      ) : null}

      {state.error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {emailMatches ? (
        <form action={action} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {pending ? t.accepting : t.accept}
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-3">
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(inviteEmail)}`}
            className="flex w-full items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {t.loginOrSignup}
          </Link>
          <p className="text-xs text-slate-500">{t.loginHint}</p>
        </div>
      )}
    </div>
  );
}
