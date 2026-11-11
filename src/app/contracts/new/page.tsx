import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireProfile } from "@/lib/auth/profile";
import { getDictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { ContractForm } from "../contract-form";

export const instant = false;

export default async function NewContractPage() {
  const { locale, dictionary } = await getDictionary();
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const [{ data: suppliers }, { data: owners }] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", profile.organization_id)
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", profile.organization_id)
      .order("full_name"),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader profile={profile} dictionary={dictionary} locale={locale} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/contracts" className="text-sm font-medium text-teal-700">
          {dictionary.contracts.back}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          {dictionary.contracts.newTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contracts.newTip}</p>
        <div className="mt-8 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <ContractForm
            suppliers={suppliers ?? []}
            owners={owners ?? []}
            defaultOwnerId={profile.id}
            dictionary={dictionary}
          />
        </div>
      </main>
    </div>
  );
}
