import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { requireProfile } from "@/lib/auth/profile";
import { getDictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import type { Supplier } from "@/lib/types";
import { deleteSupplier } from "../actions";
import { SupplierForm } from "../supplier-form";

export const instant = false;

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dictionary } = await getDictionary();
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const supplier = data as Supplier;

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader profile={profile} dictionary={dictionary} locale={locale} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/suppliers" className="text-sm font-medium text-teal-700">
          {dictionary.suppliers.back}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-900">{supplier.name}</h1>
          <form action={deleteSupplier}>
            <input type="hidden" name="id" value={supplier.id} />
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              {dictionary.suppliers.delete}
            </button>
          </form>
        </div>
        <div className="mt-8 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <SupplierForm supplier={supplier} dictionary={dictionary} />
        </div>
      </main>
    </div>
  );
}
