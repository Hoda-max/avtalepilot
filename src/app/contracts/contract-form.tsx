"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Contract, Profile, Supplier } from "@/lib/types";
import {
  createContract,
  updateContract,
  type ContractFormState,
} from "./actions";

const initialState: ContractFormState = {};

type ContractFormProps = {
  contract?: Contract;
  suppliers: Pick<Supplier, "id" | "name">[];
  owners: Pick<Profile, "id" | "full_name">[];
  defaultOwnerId?: string;
  dictionary: Dictionary;
};

export function ContractForm({
  contract,
  suppliers,
  owners,
  defaultOwnerId,
  dictionary,
}: ContractFormProps) {
  const action = contract ? updateContract : createContract;
  const [state, formAction, pending] = useActionState(action, initialState);
  const t = dictionary.contracts;

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      {contract ? <input type="hidden" name="id" value={contract.id} /> : null}

      <label className="block text-sm font-medium text-slate-700">
        {t.form.title}
        <input
          name="title"
          required
          defaultValue={contract?.title ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {t.form.supplier}
          <select
            name="supplier_id"
            defaultValue={contract?.supplier_id ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          >
            <option value="">{t.form.chooseSupplier}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          {t.form.owner}
          <select
            name="owner_user_id"
            defaultValue={contract?.owner_user_id ?? defaultOwnerId ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          >
            <option value="">{t.form.chooseOwner}</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.full_name || t.unnamed}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-slate-500">
            {t.form.ownerHelp}
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {t.form.department}
          <input
            name="department"
            defaultValue={contract?.department ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.form.location}
          <input
            name="location"
            defaultValue={contract?.location ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {t.form.cost}
          <input
            name="cost"
            inputMode="decimal"
            defaultValue={contract?.cost ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.form.status}
          <select
            name="status"
            defaultValue={contract?.status ?? "active"}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          >
            <option value="draft">{t.status.draft}</option>
            <option value="active">{t.status.active}</option>
            <option value="ended">{t.status.ended}</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        {t.form.notes}
        <textarea
          name="notes"
          rows={4}
          defaultValue={contract?.notes ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        {t.form.document}
        <input
          type="file"
          name="document"
          accept=".pdf,image/*"
          className="mt-1 block w-full text-sm text-slate-600"
        />
        {contract?.document_path ? (
          <span className="mt-1 block text-xs text-slate-500">
            {t.form.documentReplace}
          </span>
        ) : null}
      </label>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {pending ? t.form.saving : contract ? t.form.save : t.form.create}
      </button>
    </form>
  );
}
