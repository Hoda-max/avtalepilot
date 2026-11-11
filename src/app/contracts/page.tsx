import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { requireProfile } from "@/lib/auth/profile";
import { formatNok } from "@/lib/contracts";
import { getDictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import type { ContractStatus, ContractWithRelations, Supplier } from "@/lib/types";

export const instant = false;

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    supplier?: string;
    owner?: string;
  }>;
}) {
  const { locale, dictionary } = await getDictionary();
  const { profile } = await requireProfile();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();
  const supplier = (params.supplier ?? "").trim();
  const owner = (params.owner ?? "").trim();

  const supabase = await createClient();

  const [{ data: suppliersData }, { data: ownersData }] = await Promise.all([
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

  let request = supabase
    .from("contracts")
    .select("*, suppliers(id, name), profiles!contracts_owner_user_id_fkey(id, full_name)")
    .eq("organization_id", profile.organization_id)
    .order("updated_at", { ascending: false });

  if (q) {
    request = request.or(
      `title.ilike.%${q}%,department.ilike.%${q}%,location.ilike.%${q}%`,
    );
  }
  if (status === "draft" || status === "active" || status === "ended") {
    request = request.eq("status", status);
  }
  if (supplier) {
    request = request.eq("supplier_id", supplier);
  }
  if (owner) {
    request = request.eq("owner_user_id", owner);
  }

  const { data, error } = await request;
  const contracts = (data ?? []) as ContractWithRelations[];
  const suppliers = (suppliersData ?? []) as Pick<Supplier, "id" | "name">[];

  const statusLabel = (value: ContractStatus) => dictionary.contracts.status[value];

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader profile={profile} dictionary={dictionary} locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {dictionary.contracts.title}
            </h1>
            <p className="mt-2 text-slate-600">{dictionary.contracts.subtitle}</p>
          </div>
          <Link
            href="/contracts/new"
            className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {dictionary.contracts.new}
          </Link>
        </div>

        <form className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={dictionary.contracts.searchPlaceholder}
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2 lg:col-span-2"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          >
            <option value="">{dictionary.contracts.allStatuses}</option>
            <option value="active">{dictionary.contracts.status.active}</option>
            <option value="draft">{dictionary.contracts.status.draft}</option>
            <option value="ended">{dictionary.contracts.status.ended}</option>
          </select>
          <select
            name="supplier"
            defaultValue={supplier}
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          >
            <option value="">{dictionary.contracts.allSuppliers}</option>
            {suppliers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-100"
          >
            {dictionary.contracts.filter}
          </button>
          <select
            name="owner"
            defaultValue={owner}
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2 sm:col-span-2 lg:col-span-5"
          >
            <option value="">{dictionary.contracts.allOwners}</option>
            {(ownersData ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.full_name || dictionary.contracts.unnamed}
              </option>
            ))}
          </select>
        </form>

        {error ? (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {dictionary.contracts.loadError} ({error.message})
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {contracts.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title={dictionary.contracts.emptyTitle}
                description={dictionary.contracts.emptyDescription}
                actionHref="/contracts/new"
                actionLabel={dictionary.contracts.new}
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {contracts.map((contract) => (
                <li key={contract.id}>
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="block px-4 py-4 hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {contract.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {contract.suppliers?.name ??
                            dictionary.contracts.noSupplier}
                          {" · "}
                          {contract.profiles?.full_name ??
                            dictionary.contracts.noOwner}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium text-slate-700">
                          {statusLabel(contract.status as ContractStatus)}
                        </p>
                        <p className="text-slate-500">{formatNok(contract.cost)}</p>
                      </div>
                    </div>
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
