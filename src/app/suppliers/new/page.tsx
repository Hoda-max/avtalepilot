import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireProfile } from "@/lib/auth/profile";
import { getDictionary } from "@/i18n/get-dictionary";
import { SupplierForm } from "../supplier-form";

export const instant = false;

export default async function NewSupplierPage() {
  const { locale, dictionary } = await getDictionary();
  const { profile } = await requireProfile();

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader profile={profile} dictionary={dictionary} locale={locale} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/suppliers" className="text-sm font-medium text-teal-700">
          {dictionary.suppliers.back}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          {dictionary.suppliers.newTitle}
        </h1>
        <div className="mt-8 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <SupplierForm dictionary={dictionary} />
        </div>
      </main>
    </div>
  );
}
