"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { useRouter } from "@/i18n/navigation";

export const SubtitleSearch = () => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");

  const t = useTranslations();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();

      const keyword = inputRef.current?.value.trim();
      if (keyword) {
        router.push(`/?keyword=${encodeURIComponent(keyword)}`);
      } else {
        router.push("/");
      }
    },
    [router]
  );

  useEffect(() => {
    if (!keyword && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [keyword]);

  return (
    <form className="relative" onSubmit={handleSearch}>
      <input
        type="text"
        name="keyword"
        defaultValue={keyword || ""}
        className="border border-gray-200 bg-white rounded-full w-full p-2 pl-4 pr-12 h-12 dark:bg-black"
        placeholder={t("video.search.placeholder")}
        ref={inputRef}
      />
      <button
        type="submit"
        className="flex justify-center items-center absolute top-1 right-1 w-10 h-10 rounded-full bg-gray-200 cursor-pointer"
      >
        <Image src="/search.svg" alt="검색" width={24} height={24} />
      </button>
    </form>
  );
};
