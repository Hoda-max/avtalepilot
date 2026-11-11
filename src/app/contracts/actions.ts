"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/profile";
import { sanitizeFileName } from "@/lib/contracts";
import { createClient } from "@/lib/supabase/server";
import type { ContractStatus } from "@/lib/types";

export type ContractFormState = {
  error?: string;
  message?: string;
};

function parseOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseCost(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!raw) return null;
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 0) {
    return Number.NaN;
  }
  return number;
}

function validateUpload(file: File) {
  const maxBytes = 10 * 1024 * 1024;
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (file.size > maxBytes) {
    return "Filen er for stor. Maks 10 MB.";
  }

  if (file.type && !allowed.includes(file.type)) {
    return "Tillatte filtyper: PDF, JPG, PNG eller WebP.";
  }

  return null;
}

function parseStatus(value: FormDataEntryValue | null): ContractStatus {
  const status = String(value ?? "active");
  if (status === "draft" || status === "active" || status === "ended") {
    return status;
  }
  return "active";
}

async function uploadContractDocument(options: {
  organizationId: string;
  contractId: string;
  file: File;
}) {
  const { organizationId, contractId, file } = options;
  if (!file || file.size === 0) {
    return { path: null as string | null, error: null as string | null };
  }

  const validationError = validateUpload(file);
  if (validationError) {
    return { path: null, error: validationError };
  }

  const supabase = await createClient();
  const safeName = sanitizeFileName(file.name || "dokument.pdf");
  const path = `${organizationId}/${contractId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("contract-documents")
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "application/pdf",
    });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path, error: null };
}

export async function createContract(
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const { profile } = await requireProfile();
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    return { error: "Skriv inn en tittel for avtalen." };
  }

  if (title.length > 200) {
    return { error: "Tittelen er for lang (maks 200 tegn)." };
  }

  const cost = parseCost(formData.get("cost"));
  if (Number.isNaN(cost)) {
    return { error: "Kostnad må være et gyldig tall (0 eller høyere)." };
  }

  const supabase = await createClient();
  const payload = {
    organization_id: profile.organization_id,
    title,
    supplier_id: parseOptionalText(formData.get("supplier_id")),
    owner_user_id:
      parseOptionalText(formData.get("owner_user_id")) ?? profile.id,
    department: parseOptionalText(formData.get("department")),
    location: parseOptionalText(formData.get("location")),
    cost,
    status: parseStatus(formData.get("status")),
    notes: parseOptionalText(formData.get("notes")),
  };

  const { data, error } = await supabase
    .from("contracts")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { error: `Kunne ikke opprette avtale: ${error?.message}` };
  }

  const file = formData.get("document");
  if (file instanceof File && file.size > 0) {
    const upload = await uploadContractDocument({
      organizationId: profile.organization_id,
      contractId: data.id,
      file,
    });

    if (upload.error) {
      return {
        error: `Avtalen ble opprettet, men filopplasting feilet: ${upload.error}`,
      };
    }

    if (upload.path) {
      await supabase
        .from("contracts")
        .update({ document_path: upload.path })
        .eq("id", data.id);
    }
  }

  revalidatePath("/contracts");
  revalidatePath("/dashboard");
  redirect(`/contracts/${data.id}`);
}

export async function updateContract(
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const { profile } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!id || !title) {
    return { error: "Mangler avtale eller tittel." };
  }

  if (title.length > 200) {
    return { error: "Tittelen er for lang (maks 200 tegn)." };
  }

  const cost = parseCost(formData.get("cost"));
  if (Number.isNaN(cost)) {
    return { error: "Kostnad må være et gyldig tall (0 eller høyere)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({
      title,
      supplier_id: parseOptionalText(formData.get("supplier_id")),
      owner_user_id: parseOptionalText(formData.get("owner_user_id")),
      department: parseOptionalText(formData.get("department")),
      location: parseOptionalText(formData.get("location")),
      cost,
      status: parseStatus(formData.get("status")),
      notes: parseOptionalText(formData.get("notes")),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    return { error: `Kunne ikke lagre: ${error.message}` };
  }

  const file = formData.get("document");
  if (file instanceof File && file.size > 0) {
    const upload = await uploadContractDocument({
      organizationId: profile.organization_id,
      contractId: id,
      file,
    });

    if (upload.error) {
      return { error: `Lagring OK, men filopplasting feilet: ${upload.error}` };
    }

    if (upload.path) {
      await supabase
        .from("contracts")
        .update({ document_path: upload.path })
        .eq("id", id);
    }
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/dashboard");
  return { message: "Avtalen er lagret." };
}

export async function deleteContract(formData: FormData) {
  const { profile } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("document_path")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (data?.document_path) {
    await supabase.storage
      .from("contract-documents")
      .remove([data.document_path]);
  }

  await supabase
    .from("contracts")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  revalidatePath("/contracts");
  revalidatePath("/dashboard");
  redirect("/contracts");
}
