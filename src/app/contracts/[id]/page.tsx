import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { requireProfile } from "@/lib/auth/profile";
import { formatNok } from "@/lib/contracts";
import { getDictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import type {
  Contract,
  ContractDate,
  ContractStatus,
  DecisionWithActor,
} from "@/lib/types";
import { deleteContract } from "../actions";
import { ContractDatesPanel } from "../contract-dates-panel";
import { ContractForm } from "../contract-form";

export const instant = false;

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dictionary } = await getDictionary();
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const [
    { data },
    { data: suppliers },
    { data: owners },
    { data: datesData },
    { data: decisionsData },
  ] = await Promise.all([
    supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .maybeSingle(),
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
    supabase
      .from("contract_dates")
      .select("*")
      .eq("contract_id", id)
      .order("due_date", { ascending: true }),
    supabase
      .from("decisions")
      .select("*, profiles!decisions_decided_by_fkey(id, full_name)")
      .eq("contract_id", id)
      .order("decided_at", { ascending: false }),
  ]);

  if (!data) {
    notFound();
  }

  const contract = data as Contract;
  const dates = (datesData ?? []) as ContractDate[];
  const decisions = (decisionsData ?? []) as DecisionWithActor[];
  let documentUrl: string | null = null;

  if (contract.document_path) {
    const { data: signed } = await supabase.storage
      .from("contract-documents")
      .createSignedUrl(contract.document_path, 60 * 60);
    documentUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader profile={profile} dictionary={dictionary} locale={locale} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/contracts" className="text-sm font-medium text-teal-700">
          {dictionary.contracts.back}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{contract.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contracts.status[contract.status as ContractStatus]}
              {" · "}
              {formatNok(contract.cost)}
            </p>
          </div>
          <form action={deleteContract}>
            <input type="hidden" name="id" value={contract.id} />
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              {dictionary.contracts.delete}
            </button>
          </form>
        </div>

        {documentUrl ? (
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-100"
          >
            {dictionary.contracts.openDocument}
          </a>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {dictionary.contracts.noDocument}
          </p>
        )}

        <div className="mt-8">
          <ContractDatesPanel
            contractId={contract.id}
            dates={dates}
            decisions={decisions}
            dictionary={dictionary}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {dictionary.contracts.details}
          </h2>
          <ContractForm
            contract={contract}
            suppliers={suppliers ?? []}
            owners={owners ?? []}
            dictionary={dictionary}
          />
        </div>
      </main>
    </div>
  );
}
