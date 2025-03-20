import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";

import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { FirebaseProvider } from "@/lib/auth/FIrebaseProvider";

import { LocaleSelector } from "../../components/LocaleSelector";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-railway",
  weight: "700",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wonwoo Video",
  description: "그냥 원우만 보고 싶어",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col items-center`}
      >
        <NextIntlClientProvider>
          <FirebaseProvider>
            <header className="flex justify-center items-center sticky top-0 pt-3 pb-3 pl-6 pr-6 w-full max-w-md bg-white/30 backdrop-blur-sm dark:bg-black/30 z-10">
              <Link href="/" locale={locale} passHref>
                <h1 className={`${raleway.className} antialiased text-xl`}>
                  WONWOO VIDEO
                </h1>
              </Link>
              <LocaleSelector />
            </header>

            <main className="mb-8 w-full max-w-md">{children}</main>
          </FirebaseProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
