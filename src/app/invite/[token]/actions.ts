"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Invite, UserRole } from "@/lib/types";

export type AcceptInviteState = {
  error?: string;
  message?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function getInviteByToken(token: string): Promise<{
  invite: Invite | null;
  organizationName: string | null;
  error?: string;
}> {
  let admin;
  try {
    admin = createServiceClient();
  } catch (err) {
    return {
      invite: null,
      organizationName: null,
      error:
        err instanceof Error
          ? err.message
          : "SUPABASE_SERVICE_ROLE_KEY mangler.",
    };
  }

  const { data: invite, error } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !invite) {
    return { invite: null, organizationName: null, error: "Invitasjonen finnes ikke." };
  }

  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", invite.organization_id)
    .maybeSingle();

  return {
    invite: invite as Invite,
    organizationName: org?.name ?? null,
  };
}

export async function acceptInvite(
  _prevState: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    return { error: "Mangler invitasjonskode." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Du må logge inn eller opprette konto først." };
  }

  const { invite, error: loadError } = await getInviteByToken(token);
  if (!invite || loadError) {
    return { error: loadError ?? "Invitasjonen finnes ikke." };
  }

  if (invite.revoked_at) {
    return { error: "Denne invitasjonen er trukket tilbake." };
  }

  if (invite.accepted_at) {
    return { error: "Denne invitasjonen er allerede brukt." };
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { error: "Denne invitasjonen er utløpt. Be om en ny." };
  }

  if (normalizeEmail(user.email) !== normalizeEmail(invite.email)) {
    return {
      error: `Logg inn med ${invite.email} for å godta denne invitasjonen (du er logget inn som ${user.email}).`,
    };
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

  const { data: existing } = await admin
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.organization_id === invite.organization_id) {
      await admin
        .from("invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);
      redirect("/dashboard");
    }
    return {
      error:
        "Kontoen din er allerede koblet til en annen organisasjon. Kontakt en administrator.",
    };
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email.split("@")[0];

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    organization_id: invite.organization_id,
    full_name: fullName,
    role: invite.role as UserRole,
    email: user.email,
  });

  if (profileError) {
    return { error: `Kunne ikke koble kontoen: ${profileError.message}` };
  }

  await admin
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  redirect("/dashboard");
}
