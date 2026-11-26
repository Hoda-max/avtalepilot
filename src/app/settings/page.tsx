import { AppHeader } from "@/components/app-header";
import { LanguageSwitcher } from "@/components/language-switcher";
import { requireProfile } from "@/lib/auth/profile";
import { getDictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import type { Invite, Profile } from "@/lib/types";
import { PeoplePanel } from "./people-panel";
import { ReminderEmailPanel } from "./reminder-email-panel";
import { SettingsForms } from "./settings-forms";

export const instant = false;

export default async function SettingsPage() {
  const { locale, dictionary } = await getDictionary();
  const { user, profile } = await requireProfile();
  const supabase = await createClient();

  let members: Pick<Profile, "id" | "full_name" | "email" | "role">[] = [];
  let pendingInvites: Pick<
    Invite,
    "id" | "email" | "role" | "token" | "expires_at" | "created_at"
  >[] = [];

  if (profile.role === "admin") {
    const [{ data: memberRows }, { data: inviteRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("organization_id", profile.organization_id)
        .order("full_name", { ascending: true }),
      supabase
        .from("invites")
        .select("id, email, role, token, expires_at, created_at")
        .eq("organization_id", profile.organization_id)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
    ]);
    members = memberRows ?? [];
    pendingInvites = inviteRows ?? [];
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader profile={profile} dictionary={dictionary} locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {dictionary.settings.title}
        </h1>
        <p className="mt-2 text-slate-600">{dictionary.settings.subtitle}</p>

        <section className="mt-8 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {dictionary.settings.language}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {dictionary.settings.languageHelp}
          </p>
          <div className="mt-4">
            <LanguageSwitcher
              locale={locale}
              label={dictionary.settings.language}
            />
          </div>
        </section>

        <div className="mt-6 space-y-6">
          {profile.role === "admin" ? (
            <PeoplePanel
              currentUserId={user.id}
              members={members}
              pendingInvites={pendingInvites}
              dictionary={dictionary}
            />
          ) : null}
          <SettingsForms
            profile={profile}
            loginEmail={user.email ?? ""}
            reminderEmail={profile.email ?? user.email ?? ""}
            members={members}
            dictionary={dictionary}
          />
          <ReminderEmailPanel
            dictionary={dictionary}
            isAdmin={profile.role === "admin"}
          />
        </div>
      </main>
    </div>
  );
}
