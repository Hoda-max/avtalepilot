import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileWithOrganization } from "@/lib/types";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return { user, profile: null as ProfileWithOrganization | null };
  }

  return {
    user,
    profile: profile as ProfileWithOrganization,
  };
}

export async function requireProfile() {
  const result = await getCurrentProfile();

  if (!result?.user) {
    redirect("/login");
  }

  if (!result.profile) {
    redirect("/onboarding");
  }

  return {
    user: result.user,
    profile: result.profile,
  };
}
