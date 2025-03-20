"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export const LocaleSelector = () => {
  const t = useTranslations();

  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLocaleSelect = useCallback(() => {
    setIsExpanded(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
        onClick={() => setIsExpanded((prev) => !prev)}
        ref={buttonRef}
      >
        <Image
          src="/globe.svg"
          width={24}
          height={24}
          alt={t("settings.language")}
          className="dark:invert"
        />
      </button>

      {isExpanded && (
        <div
          className="absolute right-0 z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700"
          ref={dropdownRef}
        >
          <ul
            className="py-2 text-sm text-gray-700 dark:text-gray-200"
            aria-labelledby="dropdownDefaultButton"
          >
            <li key="ko">
              <Link
                href="/"
                locale="ko"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={handleLocaleSelect}
              >
                한국어
              </Link>
            </li>
            <li>
              <Link
                href="/"
                locale="en"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={handleLocaleSelect}
              >
                English
              </Link>
            </li>
            <li>
              <Link
                href="/"
                locale="zh-CN"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={handleLocaleSelect}
              >
                中文(简体)
              </Link>
            </li>
            <li>
              <Link
                href="/"
                locale="zh-TW"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={handleLocaleSelect}
              >
                中文(繁體)
              </Link>
            </li>
            <li>
              <Link
                href="/"
                locale="ja"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={handleLocaleSelect}
              >
                日本語
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
