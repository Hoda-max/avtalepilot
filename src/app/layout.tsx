import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { isRtlLocale } from "@/i18n/config";
import { getLocale } from "@/i18n/get-dictionary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AvtalePilot",
  description:
    "Keep contracts, ownership, and deadlines under control in one place.",
};

// Locale comes from a cookie, so this layout cannot ship a fully static shell.
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const direction = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
