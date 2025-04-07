import { Metadata } from "next";
import Link from "next/link";

import "../globals.css";

import CMSAuth from "./auth";

export const metadata: Metadata = {
  title: "CMS | Wonwoo Video",
  description: "Content Management System for Wonwoo Video",
};

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <CMSAuth>
          <div className="flex min-h-screen">
            <nav className="w-64 bg-white dark:bg-gray-800 shadow-md">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                  CMS
                </h2>
              </div>
              <ul className="p-4 space-y-2">
                <li>
                  <Link
                    href="/cms"
                    className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cms/videos"
                    className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                  >
                    Videos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cms/keywords"
                    className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                  >
                    Keywords
                  </Link>
                </li>
              </ul>
            </nav>

            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          </div>
        </CMSAuth>
      </body>
    </html>
  );
}
