import Image from "next/image";
import { Suspense } from "react";

import { InfiniteVideoList } from "@/components/InfiniteVideoList";
import { Loader } from "@/components/Loader";
import { SubtitleSearch } from "@/components/SubtitleSearch";
import { Link } from "@/i18n/navigation";
import { PaginationParams } from "@/lib/video";
import { getMoreVideos } from "@/lib/video/actions";

function createUrlWithoutTag(searchParams: { keyword?: string; tag?: string }) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key !== "tag" && value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `/?${queryString}` : "/";
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<
    Omit<PaginationParams, "tag" | "limit" | "publishedOnly"> & {
      keyword?: string;
      tag?: string;
    }
  >;
};

export default async function Home({ params, searchParams }: Props) {
  const { locale } = await params;
  const { keyword, tag, cursor } = await searchParams;

  const { videos, nextCursor } = await getMoreVideos({ tag, keyword, locale });

  return (
    <div className={tag ? "pb-12" : ""}>
      <div className="p-6 pt-0 pb-3">
        <SubtitleSearch />
      </div>

      <Suspense
        key={cursor || keyword || tag}
        fallback={
          <div className="flex justify-center items-center">
            <Loader />
          </div>
        }
      >
        <InfiniteVideoList
          initialVideos={videos}
          initialNextCursor={nextCursor}
          locale={locale}
          keyword={keyword}
          tag={tag}
        />
      </Suspense>

      {tag && (
        <div className="fixed bottom-0 p-4 w-full max-w-md bg-white border-t-1 border-gray-500 dark:bg-black">
          <div className="inline-flex items-center gap-2 pt-1 pr-3 pb-1 pl-3  bg-black text-white rounded-full dark:bg-gray-500">
            <span className="text-xs">{tag}</span>
            <Link href={createUrlWithoutTag({ keyword, tag })} locale={locale}>
              <Image
                src="/close.svg"
                width={16}
                height={16}
                alt="reset filter"
                className="invert"
              />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
