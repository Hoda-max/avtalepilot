"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export type SupplierFormState = {
  error?: string;
  message?: string;
};

export async function createSupplier(
  _prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const { profile } = await requireProfile();
  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) {
    return { error: "Skriv inn leverandørnavn." };
  }

  if (name.length > 150) {
    return { error: "Navnet er for langt (maks 150 tegn)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    organization_id: profile.organization_id,
    name,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    notes: notes || null,
  });

  if (error) {
    return { error: `Kunne ikke lagre leverandør: ${error.message}` };
  }

  revalidatePath("/suppliers");
  revalidatePath("/contracts");
  redirect("/suppliers");
}

export async function updateSupplier(
  _prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  await requireProfile();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !name) {
    return { error: "Mangler leverandør eller navn." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({
      name,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    return { error: `Kunne ikke oppdatere: ${error.message}` };
  }

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  revalidatePath("/contracts");
  return { message: "Leverandør lagret." };
}

export async function deleteSupplier(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("suppliers").delete().eq("id", id);

  revalidatePath("/suppliers");
  revalidatePath("/contracts");
  redirect("/suppliers");
}
