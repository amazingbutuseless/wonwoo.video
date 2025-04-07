import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import { redirect } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";

import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LocaleSync } from "@/i18n/LocaleSync";
import { FirebaseProvider } from "@/lib/auth/FirebaseProvider";
import { Preference } from "@/components/Preference";
import { ToastProvider } from "@/components/Toast";

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
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon.png", sizes: "180x180" },
      {
        url: "/apple-touch-icon.png",
        rel: "apple-touch-icon-precomposed",
      },
    ],
    shortcut: "/default-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wonwoo Video",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "rgba(255, 255, 255, 0.6)",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "rgba(0, 0, 0, 0.6)",
    },
  ],
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
    redirect("/en");
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col items-center min-h-screen`}
      >
        <NextIntlClientProvider>
          <LocaleSync />

          <ToastProvider>
            <FirebaseProvider>
              <header
                className="flex justify-between items-center sticky top-0 w-full max-w-md bg-white/30 backdrop-blur-sm dark:bg-black/30 z-10"
                style={{
                  paddingTop: "max(env(safe-area-inset-top), 0.75rem)",
                  paddingBottom: "0.75rem",
                  paddingLeft: "1.5rem",
                  paddingRight: "1.5rem",
                }}
              >
                <Link href="/" locale={locale} passHref className="flex-1">
                  <h1 className={`${raleway.className} antialiased text-xl`}>
                    WONWOO VIDEO
                  </h1>
                </Link>
                <Preference />
              </header>

              <main className="mb-8 w-full max-w-md">{children}</main>
            </FirebaseProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
