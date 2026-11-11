import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getCurrentProfile } from "@/lib/auth/profile";
import { getDictionary } from "@/i18n/get-dictionary";

export const instant = false;

export default async function OnboardingPage() {
  const { locale, dictionary } = await getDictionary();
  const result = await getCurrentProfile();

  if (!result?.user) {
    redirect("/login");
  }

  if (result.profile) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher locale={locale} label={dictionary.nav.language} />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        {dictionary.brand}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">
        {dictionary.onboarding.title}
      </h1>
      <p className="mt-4 text-slate-600">{dictionary.onboarding.body}</p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex w-fit rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
      >
        {dictionary.onboarding.tryAgain}
      </Link>
    </main>
  );
}
