"use client";

import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { useCallback } from "react";

export const TagLink = ({ tag, locale }: { tag: string; locale: string }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createTagLink = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tag", tag);
    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams, tag]);

  return (
    <Link href={createTagLink()} locale={locale}>
      <span className="text-sm underline">{tag}</span>
    </Link>
  );
};
