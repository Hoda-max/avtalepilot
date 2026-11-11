"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Supplier } from "@/lib/types";
import {
  createSupplier,
  updateSupplier,
  type SupplierFormState,
} from "./actions";

const initialState: SupplierFormState = {};

type SupplierFormProps = {
  supplier?: Supplier;
  dictionary: Dictionary;
};

export function SupplierForm({ supplier, dictionary }: SupplierFormProps) {
  const action = supplier ? updateSupplier : createSupplier;
  const [state, formAction, pending] = useActionState(action, initialState);
  const t = dictionary.suppliers;

  return (
    <form action={formAction} className="space-y-4">
      {supplier ? <input type="hidden" name="id" value={supplier.id} /> : null}

      <label className="block text-sm font-medium text-slate-700">
        {t.form.name}
        <input
          name="name"
          required
          defaultValue={supplier?.name ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        {t.form.email}
        <input
          type="email"
          name="contact_email"
          defaultValue={supplier?.contact_email ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        {t.form.phone}
        <input
          name="contact_phone"
          defaultValue={supplier?.contact_phone ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        {t.form.notes}
        <textarea
          name="notes"
          rows={4}
          defaultValue={supplier?.notes ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
        />
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
        {pending ? t.form.saving : supplier ? t.form.save : t.form.create}
      </button>
    </form>
  );
}
