"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/i18n/actions";
import { localeLabels, locales, type Locale } from "@/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
};

export function LanguageSwitcher({ locale, label }: LanguageSwitcherProps) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        key={locale}
        value={locale}
        disabled={pending}
        onChange={(event) => {
          const nextLocale = event.target.value;
          startTransition(async () => {
            await setLocaleAction(nextLocale);
            router.refresh();
          });
        }}
        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-700 outline-none ring-teal-600 focus:ring-2 disabled:opacity-60"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
