import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function HomePage() {
  const { locale, dictionary } = await getDictionary();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-6 flex justify-end">
        <LanguageSwitcher locale={locale} label={dictionary.nav.language} />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        {dictionary.brand}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
        {dictionary.home.title}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-600">
        {dictionary.home.subtitle}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {dictionary.home.login}
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {dictionary.home.signup}
        </Link>
      </div>
      <ul className="mt-10 space-y-2 text-sm text-slate-600">
        <li>• {dictionary.home.bullet1}</li>
        <li>• {dictionary.home.bullet2}</li>
        <li>• {dictionary.home.bullet3}</li>
      </ul>
    </main>
  );
}
