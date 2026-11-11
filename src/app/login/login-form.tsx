"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { login, signup, type AuthState } from "./actions";

const initialState: AuthState = {};

type LoginFormProps = {
  dictionary: Dictionary;
};

export function LoginForm({ dictionary }: LoginFormProps) {
  const [loginState, loginAction, loginPending] = useActionState(
    login,
    initialState,
  );
  const [signupState, signupAction, signupPending] = useActionState(
    signup,
    initialState,
  );

  const error = loginState.error ?? signupState.error;
  const message = loginState.message ?? signupState.message;
  const pending = loginPending || signupPending;

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        {dictionary.brand}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        {dictionary.login.title}
      </h1>
      <p className="mt-2 text-sm text-slate-600">{dictionary.login.subtitle}</p>

      <form className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {dictionary.login.email}
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-teal-600 focus:ring-2"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          {dictionary.login.password}
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-teal-600 focus:ring-2"
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            formAction={loginAction}
            disabled={pending}
            className="flex-1 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {loginPending
              ? dictionary.login.submitting
              : dictionary.login.submit}
          </button>
          <button
            formAction={signupAction}
            disabled={pending}
            className="flex-1 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-100 disabled:opacity-60"
          >
            {signupPending
              ? dictionary.login.creating
              : dictionary.login.create}
          </button>
        </div>
      </form>
    </div>
  );
}
