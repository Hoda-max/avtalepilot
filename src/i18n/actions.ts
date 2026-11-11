"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "./config";

export async function setLocaleAction(nextLocale: string) {
  const locale: Locale = isLocale(nextLocale) ? nextLocale : defaultLocale;

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return locale;
}
