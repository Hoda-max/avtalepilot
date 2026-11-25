import { AppHeader } from "@/components/app-header";
import { LanguageSwitcher } from "@/components/language-switcher";
import { requireProfile } from "@/lib/auth/profile";
import { getDictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { ReminderEmailPanel } from "./reminder-email-panel";
import { SettingsForms } from "./settings-forms";

export const instant = false;

export default async function SettingsPage() {
  const { locale, dictionary } = await getDictionary();
  const { user, profile } = await requireProfile();
  const supabase = await createClient();

  let members: Pick<Profile, "id" | "full_name" | "email" | "role">[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("organization_id", profile.organization_id)
      .order("full_name", { ascending: true });
    members = data ?? [];
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
          <SettingsForms
            profile={profile}
            loginEmail={user.email ?? profile.email ?? ""}
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
