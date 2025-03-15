"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

export const SubtitleSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  return (
    <form className="relative" onSubmit={handleSearch}>
      <input
        type="text"
        name="keyword"
        defaultValue={searchParams.get("keyword") || ""}
        className="border border-gray-200 rounded-full w-full p-2 pl-4 pr-12 h-12"
        placeholder="검색어(e.g. 남신)"
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
