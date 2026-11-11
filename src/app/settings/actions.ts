"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = {
  error?: string;
  message?: string;
};

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
