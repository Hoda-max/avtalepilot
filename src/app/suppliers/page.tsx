import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { requireProfile } from "@/lib/auth/profile";
import { getDictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import type { Supplier } from "@/lib/types";

export const instant = false;

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale, dictionary } = await getDictionary();
  const { profile } = await requireProfile();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createClient();
  let request = supabase
    .from("suppliers")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("name", { ascending: true });

  if (query) {
    request = request.ilike("name", `%${query}%`);
  }

  const { data, error } = await request;
  const suppliers = (data ?? []) as Supplier[];

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader profile={profile} dictionary={dictionary} locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {dictionary.suppliers.title}
            </h1>
            <p className="mt-2 text-slate-600">{dictionary.suppliers.subtitle}</p>
          </div>
          <Link
            href="/suppliers/new"
            className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {dictionary.suppliers.new}
          </Link>
        </div>

        <form className="mt-6">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={dictionary.suppliers.searchPlaceholder}
            className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          />
        </form>

        {error ? (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {dictionary.suppliers.loadError} ({error.message})
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {suppliers.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title={dictionary.suppliers.emptyTitle}
                description={dictionary.suppliers.emptyDescription}
                actionHref="/suppliers/new"
                actionLabel={dictionary.suppliers.new}
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {suppliers.map((supplier) => (
                <li key={supplier.id}>
                  <Link
                    href={`/suppliers/${supplier.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{supplier.name}</p>
                      <p className="text-sm text-slate-500">
                        {supplier.contact_email || dictionary.suppliers.noEmail}
                      </p>
                    </div>
                    <span className="text-sm text-teal-700">
                      {dictionary.suppliers.open}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
