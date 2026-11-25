import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/i18n/get-dictionary";
import { LoginForm } from "./login-form";

export const instant = false;

function safeNextPath(value: string | undefined) {
  if (!value) return "";
  if (value.startsWith("/invite/") && !value.includes("//") && !value.includes("\\")) {
    return value;
  }
  return "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string }>;
}) {
  const params = await searchParams;
  const { locale, dictionary } = await getDictionary();
  const nextPath = safeNextPath(params.next);
  const prefillEmail = params.email?.trim() ?? "";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher locale={locale} label={dictionary.nav.language} />
        </div>
        <LoginForm
          dictionary={dictionary}
          nextPath={nextPath}
          prefillEmail={prefillEmail}
        />
      </div>
    </main>
  );
}
