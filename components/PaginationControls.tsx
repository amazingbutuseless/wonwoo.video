"use client";

import { Link } from "@/i18n/navigation";

type Props = {
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  locale: string;
  keyword?: string;
  tag?: string;
};

export const PaginationControls: React.FC<Props> = ({
  nextCursor,
  prevCursor,
  hasMore,
  locale,
  keyword,
  tag,
}) => {
  return (
    <div className="flex justify-between mt-4">
      {prevCursor && (
        <Link
          href={`/?${new URLSearchParams({
            ...(keyword && { keyword }),
            ...(tag && { tag }),
            cursor: prevCursor,
            direction: "prev",
          })}`}
          locale={locale}
        >
          이전
        </Link>
      )}

      {hasMore && nextCursor ? (
        <Link
          href={`/?${new URLSearchParams({
            ...(keyword && { keyword }),
            ...(tag && { tag }),
            cursor: nextCursor,
            direction: "next",
          })}`}
          locale={locale}
        >
          더 보기
        </Link>
      ) : null}
    </div>
  );
};
