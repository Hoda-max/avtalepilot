import { cookies } from "next/headers";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(localeCookieName)?.value?.trim().toLowerCase();
  if (raw && isLocale(raw)) {
    return raw;
  }
  return defaultLocale;
}

export async function getDictionary(): Promise<{
  locale: Locale;
  dictionary: Dictionary;
}> {
  const locale = await getLocale();
  return {
    locale,
    dictionary: dictionaries[locale],
  };
}

export function fillTemplate(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
