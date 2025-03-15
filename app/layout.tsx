import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="flex justify-center items-center m-auto mt-6 mb-6 w-sm">
          <h1 className={`${raleway.className} antialiased text-xl`}>
            WONWOO VIDEO
          </h1>
        </header>

        <main className="m-auto mb-8 w-sm">{children}</main>
      </body>
    </html>
  );
}
