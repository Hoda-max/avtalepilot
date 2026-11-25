import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getCurrentProfile } from "@/lib/auth/profile";
import { getDictionary } from "@/i18n/get-dictionary";
import { getInviteByToken } from "./actions";
import { InviteAcceptForm } from "./invite-accept-form";

export const instant = false;

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { locale, dictionary } = await getDictionary();
  const t = dictionary.invite;
  const result = await getCurrentProfile();
  const { invite, organizationName, error } = await getInviteByToken(token);

  const roleLabel =
    invite?.role === "admin"
      ? dictionary.settings.admin
      : dictionary.settings.member;

  let statusError: string | null = error ?? null;
  if (invite) {
    if (invite.revoked_at) statusError = t.revoked;
    else if (invite.accepted_at) statusError = t.alreadyUsed;
    else if (new Date(invite.expires_at).getTime() < Date.now()) {
      statusError = t.expired;
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher locale={locale} label={dictionary.nav.language} />
        </div>

        {!invite || statusError ? (
          <div className="rounded-2xl border border-teal-100 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              {dictionary.brand}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {t.title}
            </h1>
            <p className="mt-4 text-sm text-red-700">
              {statusError ?? t.notFound}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              {dictionary.login.submit}
            </Link>
          </div>
        ) : (
          <InviteAcceptForm
            token={token}
            inviteEmail={invite.email}
            organizationName={organizationName ?? dictionary.brand}
            roleLabel={roleLabel}
            dictionary={dictionary}
            loggedInEmail={result?.user?.email ?? null}
          />
        )}
      </div>
    </main>
  );
}
