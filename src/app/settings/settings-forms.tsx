"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ProfileWithOrganization } from "@/lib/types";
import {
  updateOrganizationName,
  updateProfileName,
  type SettingsState,
} from "./actions";

const initialState: SettingsState = {};

type SettingsFormsProps = {
  profile: ProfileWithOrganization;
  dictionary: Dictionary;
};

export function SettingsForms({ profile, dictionary }: SettingsFormsProps) {
  const [orgState, orgAction, orgPending] = useActionState(
    updateOrganizationName,
    initialState,
  );
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileName,
    initialState,
  );

  return (
    <div className="space-y-6">
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
    </div>
  );
}
