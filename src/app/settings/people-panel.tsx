"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Invite, Profile, UserRole } from "@/lib/types";
import {
  revokeInvite,
  sendInvite,
  updateMemberRole,
  type PeopleState,
} from "./people-actions";

const initialState: PeopleState = {};

type OrgMember = Pick<Profile, "id" | "full_name" | "email" | "role">;

type PeoplePanelProps = {
  currentUserId: string;
  members: OrgMember[];
  pendingInvites: Pick<
    Invite,
    "id" | "email" | "role" | "token" | "expires_at" | "created_at"
  >[];
  dictionary: Dictionary;
};

function invitePath(token: string) {
  if (typeof window === "undefined") return `/invite/${token}`;
  return `${window.location.origin}/invite/${token}`;
}

export function PeoplePanel({
  currentUserId,
  members,
  pendingInvites,
  dictionary,
}: PeoplePanelProps) {
  const t = dictionary.settings.people;
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inviteState, inviteAction, invitePending] = useActionState(
    sendInvite,
    initialState,
  );
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeInvite,
    initialState,
  );
  const [roleState, roleAction, rolePending] = useActionState(
    updateMemberRole,
    initialState,
  );

  useEffect(() => {
    if (inviteState.message || revokeState.message || roleState.message) {
      router.refresh();
    }
  }, [
    inviteState.message,
    revokeState.message,
    roleState.message,
    router,
  ]);

  const roleLabel = (role: UserRole) =>
    role === "admin" ? dictionary.settings.admin : dictionary.settings.member;

  async function copyLink(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt(t.copyFailed, url);
    }
  }

  return (
    <section className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.help}</p>
      <p className="mt-2 text-xs text-slate-500">{t.linkHelp}</p>

      <form action={inviteAction} className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">{t.inviteTitle}</h3>
        <label className="block text-sm font-medium text-slate-700">
          {t.inviteEmail}
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.inviteRole}
          <select
            name="role"
            defaultValue="member"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
          >
            <option value="member">{dictionary.settings.member}</option>
            <option value="admin">{dictionary.settings.admin}</option>
          </select>
        </label>
        {inviteState.error ? (
          <p className="text-sm text-red-700">{inviteState.error}</p>
        ) : null}
        {inviteState.message ? (
          <p className="text-sm text-teal-800">{inviteState.message}</p>
        ) : null}
        {inviteState.inviteUrl ? (
          <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
            <p className="text-xs font-medium text-teal-900">{t.inviteLink}</p>
            <p className="mt-1 break-all text-xs text-teal-800">
              {inviteState.inviteUrl}
            </p>
            <button
              type="button"
              onClick={() => copyLink(inviteState.inviteUrl!, "new")}
              className="mt-2 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
            >
              {copiedId === "new" ? t.copied : t.copyLink}
            </button>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={invitePending}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {invitePending ? dictionary.settings.saving : t.sendInvite}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">
          {t.membersTitle}
        </h3>
        {roleState.error ? (
          <p className="mt-2 text-sm text-red-700">{roleState.error}</p>
        ) : null}
        {roleState.message ? (
          <p className="mt-2 text-sm text-teal-800">{roleState.message}</p>
        ) : null}
        <ul className="mt-3 divide-y divide-slate-100">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {member.full_name || member.email || member.id}
                  {member.id === currentUserId ? (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      ({t.you})
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">{member.email ?? "—"}</p>
              </div>
              <form action={roleAction} className="flex items-center gap-2">
                <input type="hidden" name="member_id" value={member.id} />
                <select
                  name="role"
                  defaultValue={member.role}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none ring-teal-600 focus:ring-2"
                >
                  <option value="member">{dictionary.settings.member}</option>
                  <option value="admin">{dictionary.settings.admin}</option>
                </select>
                <button
                  type="submit"
                  disabled={rolePending}
                  className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-100 disabled:opacity-60"
                >
                  {t.saveRole}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">
          {t.pendingTitle}
        </h3>
        {revokeState.error ? (
          <p className="mt-2 text-sm text-red-700">{revokeState.error}</p>
        ) : null}
        {revokeState.message ? (
          <p className="mt-2 text-sm text-teal-800">{revokeState.message}</p>
        ) : null}
        {pendingInvites.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t.noPending}</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {pendingInvites.map((invite) => {
              const url = invitePath(invite.token);
              return (
                <li
                  key={invite.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {invite.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {roleLabel(invite.role)} · {t.expires}{" "}
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyLink(url, invite.id)}
                      className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-100"
                    >
                      {copiedId === invite.id ? t.copied : t.copyLink}
                    </button>
                    <form action={revokeAction}>
                      <input type="hidden" name="invite_id" value={invite.id} />
                      <button
                        type="submit"
                        disabled={revokePending}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                      >
                        {t.revoke}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
