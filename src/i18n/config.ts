export const locales = ["nb", "en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "nb";

export const localeCookieName = "avtalepilot_locale";

export const localeLabels: Record<Locale, string> = {
  nb: "Norsk",
  en: "English",
  ar: "العربية",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function isRtlLocale(locale: Locale) {
  return locale === "ar";
}
