import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/i18n/get-dictionary";
import { LoginForm } from "./login-form";

export const instant = false;

export default async function LoginPage() {
  const { locale, dictionary } = await getDictionary();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher locale={locale} label={dictionary.nav.language} />
        </div>
        <LoginForm dictionary={dictionary} />
      </div>
    </main>
  );
}
