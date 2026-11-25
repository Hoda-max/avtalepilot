"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
};

function friendlyAuthError(message: string | undefined, fallback: string) {
  if (!message) return fallback;

  const lower = message.toLowerCase();

  if (lower.includes("invalid api key") || lower.includes("jwt")) {
    return "Supabase-nøkkelen ser feil ut. Sjekk NEXT_PUBLIC_SUPABASE_ANON_KEY i .env.local (bruk anon/public eller publishable key).";
  }

  if (lower.includes("email rate limit") || lower.includes("over_email_send_rate_limit")) {
    return "For mange e-poster sendt. Vent litt, eller slå av e-postbekreftelse i Supabase.";
  }

  if (lower.includes("user already registered")) {
    return "Denne e-posten er allerede registrert. Prøv Logg inn.";
  }

  if (lower.includes("password")) {
    return "Passordet er for svakt. Bruk minst 6 tegn.";
  }

  return `${fallback} (${message})`;
}

function safeNextPath(value: string) {
  const next = value.trim();
  if (next.startsWith("/invite/") && !next.includes("//") && !next.includes("\\")) {
    return next;
  }
  return "/dashboard";
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Skriv inn e-post og passord." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: friendlyAuthError(
        error.message,
        "Kunne ikke logge inn. Sjekk e-post og passord, eller bekreft e-posten din i Supabase.",
      ),
    };
  }

  redirect(next);
}

export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Skriv inn e-post og passord." };
  }

  if (password.length < 6) {
    return { error: "Passordet må ha minst 6 tegn." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      error: friendlyAuthError(
        error.message,
        "Kunne ikke opprette konto.",
      ),
    };
  }

  // Email confirmation is still enabled: user exists, but there is no session yet.
  if (!data.session) {
    return {
      message:
        next.startsWith("/invite/")
          ? "Kontoen er opprettet. Bekreft e-posten din, logg inn, og åpne invitasjonslenken på nytt."
          : "Kontoen er opprettet, men e-postbekreftelse er på i Supabase. Opprett brukeren med Auto Confirm i Supabase (Authentication → Users), eller slå av Confirm email.",
    };
  }

  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
