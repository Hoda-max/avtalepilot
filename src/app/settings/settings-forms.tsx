"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Profile, ProfileWithOrganization } from "@/lib/types";
import {
  recoverMemberLoginEmail,
  updateLoginEmail,
  updateOrganizationName,
  updatePassword,
  updateProfileName,
  updateReminderEmail,
  type SettingsState,
} from "./actions";

const initialState: SettingsState = {};

type OrgMember = Pick<Profile, "id" | "full_name" | "email" | "role">;

type SettingsFormsProps = {
  profile: ProfileWithOrganization;
  loginEmail: string;
  reminderEmail: string;
  members: OrgMember[];
  dictionary: Dictionary;
};

export function SettingsForms({
  profile,
  loginEmail,
  reminderEmail,
  members,
  dictionary,
}: SettingsFormsProps) {
  const t = dictionary.settings.account;
  const router = useRouter();
  const [orgState, orgAction, orgPending] = useActionState(
    updateOrganizationName,
    initialState,
  );
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileName,
    initialState,
  );
  const [reminderState, reminderAction, reminderPending] = useActionState(
    updateReminderEmail,
    initialState,
  );
  const [loginState, loginAction, loginPending] = useActionState(
    updateLoginEmail,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePassword,
    initialState,
  );
  const [recoveryState, recoveryAction, recoveryPending] = useActionState(
    recoverMemberLoginEmail,
    initialState,
  );

  const otherMembers = members.filter((member) => member.id !== profile.id);

  useEffect(() => {
    if (loginState.message || reminderState.message || recoveryState.message) {
      router.refresh();
    }
  }, [
    loginState.message,
    reminderState.message,
    recoveryState.message,
    router,
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.help}</p>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-slate-100 px-3 py-2">
            <dt className="text-slate-500">{t.loginEmail}</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {loginEmail || "—"}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-100 px-3 py-2">
            <dt className="text-slate-500">{dictionary.settings.role}</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {profile.role === "admin"
                ? dictionary.settings.admin
                : dictionary.settings.member}
            </dd>
          </div>
        </dl>

        <form action={reminderAction} className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            {t.reminderEmail}
            <input
              type="email"
              name="reminder_email"
              defaultValue={reminderEmail}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
            />
          </label>
          <p className="text-xs text-slate-500">{t.reminderEmailHelp}</p>
          {reminderState.error ? (
            <p className="text-sm text-red-700">{reminderState.error}</p>
          ) : null}
          {reminderState.message ? (
            <p className="text-sm text-teal-800">{reminderState.message}</p>
          ) : null}
          <button
            type="submit"
            disabled={reminderPending}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {reminderPending
              ? dictionary.settings.saving
              : t.saveReminderEmail}
          </button>
        </form>

        <form action={loginAction} className="mt-8 space-y-3 border-t border-slate-100 pt-6">
          <h3 className="text-sm font-semibold text-slate-900">
            {t.changeLoginEmail}
          </h3>
          <p className="text-xs text-slate-500">
            {profile.role === "admin"
              ? t.loginEmailAdminHelp
              : t.loginEmailMemberHelp}
          </p>
          <label className="block text-sm font-medium text-slate-700">
            {t.newLoginEmail}
            <input
              type="email"
              name="login_email"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
            />
          </label>
          {loginState.error ? (
            <p className="text-sm text-red-700">{loginState.error}</p>
          ) : null}
          {loginState.message ? (
            <p className="text-sm text-teal-800">{loginState.message}</p>
          ) : null}
          <button
            type="submit"
            disabled={loginPending}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {loginPending ? dictionary.settings.saving : t.saveLoginEmail}
          </button>
        </form>

        <form
          action={passwordAction}
          className="mt-8 space-y-3 border-t border-slate-100 pt-6"
        >
          <label className="block text-sm font-medium text-slate-700">
            {t.password}
            <input
              type="password"
              name="password"
              minLength={6}
              required
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t.confirmPassword}
            <input
              type="password"
              name="confirm_password"
              minLength={6}
              required
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
            />
          </label>
          <p className="text-xs text-slate-500">{t.passwordHelp}</p>
          {passwordState.error ? (
            <p className="text-sm text-red-700">{passwordState.error}</p>
          ) : null}
          {passwordState.message ? (
            <p className="text-sm text-teal-800">{passwordState.message}</p>
          ) : null}
          <button
            type="submit"
            disabled={passwordPending}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {passwordPending ? dictionary.settings.saving : t.savePassword}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {dictionary.settings.profile}
        </h2>
        <form action={profileAction} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            {dictionary.settings.name}
            <input
              type="text"
              name="full_name"
              defaultValue={profile.full_name ?? ""}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
            />
          </label>
          {profileState.error ? (
            <p className="text-sm text-red-700">{profileState.error}</p>
          ) : null}
          {profileState.message ? (
            <p className="text-sm text-teal-800">{profileState.message}</p>
          ) : null}
          <button
            type="submit"
            disabled={profilePending}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {profilePending
              ? dictionary.settings.saving
              : dictionary.settings.saveName}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {dictionary.settings.organization}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {dictionary.settings.role}:{" "}
          {profile.role === "admin"
            ? dictionary.settings.admin
            : dictionary.settings.member}
        </p>

        {profile.role === "admin" ? (
          <form action={orgAction} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {dictionary.settings.orgName}
              <input
                type="text"
                name="name"
                defaultValue={profile.organizations.name}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
              />
            </label>
            {orgState.error ? (
              <p className="text-sm text-red-700">{orgState.error}</p>
            ) : null}
            {orgState.message ? (
              <p className="text-sm text-teal-800">{orgState.message}</p>
            ) : null}
            <button
              type="submit"
              disabled={orgPending}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {orgPending
                ? dictionary.settings.saving
                : dictionary.settings.saveOrg}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            {dictionary.settings.organization}:{" "}
            <strong>{profile.organizations.name}</strong>
          </p>
        )}
      </section>

      {profile.role === "admin" ? (
        <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {t.recoveryTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t.recoveryHelp}</p>

          {otherMembers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{t.noMembers}</p>
          ) : (
            <form action={recoveryAction} className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                {t.recoveryMember}
                <select
                  name="member_id"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
                >
                  <option value="">—</option>
                  {otherMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {(member.full_name || member.email || member.id) +
                        (member.email ? ` (${member.email})` : "")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {t.recoveryNewEmail}
                <input
                  type="email"
                  name="new_email"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {t.recoveryReason}
                <textarea
                  name="reason"
                  required
                  minLength={8}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
                />
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="identity_confirmed"
                  className="mt-1"
                />
                <span>{t.recoveryConfirm}</span>
              </label>
              {recoveryState.error ? (
                <p className="text-sm text-red-700">{recoveryState.error}</p>
              ) : null}
              {recoveryState.message ? (
                <p className="text-sm text-teal-800">{recoveryState.message}</p>
              ) : null}
              <button
                type="submit"
                disabled={recoveryPending}
                className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
              >
                {recoveryPending ? dictionary.settings.saving : t.recoverySave}
              </button>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
