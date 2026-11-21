import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server jobs (Vercel Cron).
 * Bypasses RLS — never import this into client components or expose the key.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it in Vercel env vars (Supabase → Settings → API → service_role).",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
