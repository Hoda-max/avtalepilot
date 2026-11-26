"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/profile";
import { sendInviteEmail } from "@/lib/invites/send-invite-email";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export type PeopleState = {
  error?: string;
  message?: string;
  inviteUrl?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function sendInvite(
  _prevState: PeopleState,
  formData: FormData,
): Promise<PeopleState> {
  const { user, profile } = await requireProfile();

  if (profile.role !== "admin") {
    return { error: "Bare administratorer kan sende invitasjoner." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member").trim() as UserRole;

  if (!email || !isValidEmail(email)) {
    return { error: "Skriv inn en gyldig e-postadresse." };
  }

  if (role !== "admin" && role !== "member") {
    return { error: "Ugyldig rolle." };
  }

  const supabase = await createClient();

  const { data: existingMember } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("organization_id", profile.organization_id)
    .ilike("email", email)
    .maybeSingle();

  if (existingMember) {
    return { error: "Denne personen er allerede medlem av organisasjonen." };
  }

  const { data: pending } = await supabase
    .from("invites")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .ilike("email", email)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (pending) {
    return {
      error:
        "Det finnes allerede en aktiv invitasjon til denne e-postadressen. Trekk den tilbake først, eller vent til den utløper.",
    };
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await supabase
    .from("invites")
    .insert({
      organization_id: profile.organization_id,
      email,
      role,
      token,
      invited_by: user.id,
      expires_at: expiresAt,
    })
    .select("id, token")
    .single();

  if (error || !invite) {
    return { error: `Kunne ikke opprette invitasjon: ${error?.message ?? ""}` };
  }

  const inviteUrl = `${appBaseUrl()}/invite/${invite.token}`;

  // Email is optional: without a verified Resend domain, share the link yourself.
  const mail = await sendInviteEmail({
    to: email,
    organizationName: profile.organizations.name,
    role,
    inviteUrl,
    invitedByName: profile.full_name,
  });

  revalidatePath("/settings");

  if (!mail.ok) {
    return {
      message: `Invitasjon opprettet for ${email}. E-post ble ikke sendt — kopier lenken og del den selv (WhatsApp, SMS, osv.).`,
      inviteUrl,
    };
  }

  return {
    message: `Invitasjon sendt til ${email}. Du kan også kopiere lenken under.`,
    inviteUrl,
  };
}

export async function revokeInvite(
  _prevState: PeopleState,
  formData: FormData,
): Promise<PeopleState> {
  const { profile } = await requireProfile();

  if (profile.role !== "admin") {
    return { error: "Bare administratorer kan trekke tilbake invitasjoner." };
  }

  const inviteId = String(formData.get("invite_id") ?? "").trim();
  if (!inviteId) {
    return { error: "Mangler invitasjon." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("organization_id", profile.organization_id)
    .is("accepted_at", null);

  if (error) {
    return { error: `Kunne ikke trekke tilbake: ${error.message}` };
  }

  revalidatePath("/settings");
  return { message: "Invitasjonen er trukket tilbake." };
}

export async function updateMemberRole(
  _prevState: PeopleState,
  formData: FormData,
): Promise<PeopleState> {
  const { user, profile } = await requireProfile();

  if (profile.role !== "admin") {
    return { error: "Bare administratorer kan endre roller." };
  }

  const memberId = String(formData.get("member_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as UserRole;

  if (!memberId) {
    return { error: "Velg et medlem." };
  }

  if (role !== "admin" && role !== "member") {
    return { error: "Ugyldig rolle." };
  }

  const supabase = await createClient();

  if (memberId === user.id && role === "member") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return {
        error:
          "Du kan ikke degradere deg selv når du er den eneste administratoren.",
      };
    }
  }

  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", memberId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (memberError || !member) {
    return { error: "Fant ikke medlemmet." };
  }

  if (member.role === role) {
    return { message: "Rollen er allerede satt." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", memberId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    return { error: `Kunne ikke oppdatere rolle: ${error.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return {
    message: `Rollen til ${member.full_name ?? member.email ?? "medlem"} er oppdatert.`,
  };
}
