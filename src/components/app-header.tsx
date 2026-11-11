import Link from "next/link";
import { logout } from "@/app/login/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { ProfileWithOrganization } from "@/lib/types";

type AppHeaderProps = {
  profile: ProfileWithOrganization;
  dictionary: Dictionary;
  locale: Locale;
};

export function AppHeader({ profile, dictionary, locale }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold uppercase tracking-wide text-teal-700"
          >
            {dictionary.brand}
          </Link>
          <p className="text-sm text-slate-600">{profile.organizations.name}</p>
        </div>

        <nav className="flex flex-wrap items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            {dictionary.nav.dashboard}
          </Link>
          <Link
            href="/contracts"
            className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            {dictionary.nav.contracts}
          </Link>
          <Link
            href="/suppliers"
            className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            {dictionary.nav.suppliers}
          </Link>
          <Link
            href="/settings"
            className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            {dictionary.nav.settings}
          </Link>
          <LanguageSwitcher
            locale={locale}
            label={dictionary.nav.language}
          />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              {dictionary.nav.logout}
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
