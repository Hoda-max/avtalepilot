"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/profile";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = {
  error?: string;
  message?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function syncProfileEmail(userId: string, email: string) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ email }).eq("id", userId);
}

export async function updateOrganizationName(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { profile } = await requireProfile();

  if (profile.role !== "admin") {
    return { error: "Bare administratorer kan endre organisasjonsnavnet." };
  }

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Skriv inn et organisasjonsnavn." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", profile.organization_id);

  if (error) {
    return { error: `Kunne ikke lagre: ${error.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { message: "Organisasjonsnavnet er lagret." };
}

export async function updateProfileName(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { user } = await requireProfile();
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!fullName) {
    return { error: "Skriv inn navnet ditt." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) {
    return { error: `Kunne ikke lagre: ${error.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { message: "Navnet ditt er lagret." };
}

export async function updateReminderEmail(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { user } = await requireProfile();
  const email = String(formData.get("reminder_email") ?? "").trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return { error: "Skriv inn en gyldig e-postadresse." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ email })
    .eq("id", user.id);

  if (error) {
    return { error: `Kunne ikke lagre: ${error.message}` };
  }

  revalidatePath("/settings");
  return { message: "E-post for påminnelser er lagret." };
}

export async function updateLoginEmail(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { user, profile } = await requireProfile();
  const email = String(formData.get("login_email") ?? "").trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return { error: "Skriv inn en gyldig e-postadresse." };
  }

  if (email === (user.email ?? "").toLowerCase()) {
    return { error: "Dette er allerede innloggings-e-posten din." };
  }

  // Admins (you): immediate change via service role — no confirmation link.
  // Members: keep Supabase email-change confirmation security.
  if (profile.role === "admin") {
    let admin;
    try {
      admin = createServiceClient();
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : "SUPABASE_SERVICE_ROLE_KEY mangler for å oppdatere e-post uten bekreftelse.",
      };
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email,
      email_confirm: true,
    });

    if (error) {
      return { error: `Kunne ikke oppdatere innlogging: ${error.message}` };
    }

    await syncProfileEmail(user.id, email);
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return {
      message:
        "Innloggings-e-posten er oppdatert med en gang. Bruk den nye adressen neste gang du logger inn.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    return { error: `Kunne ikke starte e-postendring: ${error.message}` };
  }

  return {
    message:
      "Sjekk den nye e-posten for en bekreftelseslenke. Innloggingen endres først når du bekrefter.",
  };
}

export async function updatePassword(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireProfile();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < 6) {
    return { error: "Passordet må være minst 6 tegn." };
  }

  if (password !== confirm) {
    return { error: "Passordene er ikke like." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: `Kunne ikke endre passord: ${error.message}` };
  }

  revalidatePath("/settings");
  return { message: "Passordet er oppdatert." };
}

export async function recoverMemberLoginEmail(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { user, profile } = await requireProfile();

  if (profile.role !== "admin") {
    return { error: "Bare administratorer kan gjenopprette innlogging." };
  }

  const memberId = String(formData.get("member_id") ?? "").trim();
  const email = String(formData.get("new_email") ?? "").trim().toLowerCase();
  const reason = String(formData.get("reason") ?? "").trim();
  const confirmed = String(formData.get("identity_confirmed") ?? "") === "on";

  if (!memberId) {
    return { error: "Velg et medlem." };
  }

  if (memberId === user.id) {
    return {
      error:
        "Bruk «Endre innloggings-e-post» over for din egen konto, ikke gjenoppretting.",
    };
  }

  if (!email || !isValidEmail(email)) {
    return { error: "Skriv inn en gyldig ny e-postadresse." };
  }

  if (reason.length < 8) {
    return {
      error:
        "Beskriv kort hvordan du bekreftet identiteten (minst 8 tegn).",
    };
  }

  if (!confirmed) {
    return {
      error: "Du må bekrefte at du har verifisert personens identitet.",
    };
  }

  const supabase = await createClient();
  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("id, organization_id, full_name, email")
    .eq("id", memberId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (memberError || !member) {
    return { error: "Fant ikke medlemmet i organisasjonen din." };
  }

  let admin;
  try {
    admin = createServiceClient();
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "SUPABASE_SERVICE_ROLE_KEY mangler.",
    };
  }

  const { error } = await admin.auth.admin.updateUserById(memberId, {
    email,
    email_confirm: true,
  });

  if (error) {
    return { error: `Kunne ikke oppdatere medlem: ${error.message}` };
  }

  await supabase.from("profiles").update({ email }).eq("id", memberId);

  revalidatePath("/settings");
  return {
    message: `Innlogging for ${member.full_name ?? member.email ?? "medlem"} er oppdatert til ${email}. Notat: ${reason}`,
  };
}
