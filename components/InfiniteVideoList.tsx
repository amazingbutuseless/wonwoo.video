"use client";

import { useState, useTransition } from "react";

import { getMoreVideos } from "@/lib/video/actions";

import { VideoCard } from "./VideoCard";
import { Loader } from "./Loader";
import { VoiceOnlyCard } from "./VoiceOnlyCard";
import { TagLink } from "./TagLink";
import { Subtitle } from "./Subtitle";
import { useTranslations } from "next-intl";

type Props = {
  initialVideos: Video[];
  initialNextCursor: string | null;
  tag?: string;
  keyword?: string;
  locale: string;
};

export const InfiniteVideoList: React.FC<Props> = ({
  initialVideos,
  initialNextCursor,
  tag,
  keyword,
  locale,
}) => {
  const t = useTranslations();

  const [videos, setVideos] = useState(initialVideos);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(!!initialNextCursor);

  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    if (!nextCursor || isPending) return;

    startTransition(async () => {
      const {
        videos: newVideos,
        nextCursor: newNextCursor,
        hasMore: newHasMore,
      } = await getMoreVideos({ cursor: nextCursor, tag, keyword, locale });

      setVideos((prev) => [...prev, ...newVideos]);
      setNextCursor(newNextCursor);
      setHasMore(newHasMore);
    });
  };

  return (
    <main className="flex flex-col gap-4 m-4">
      {videos.length > 0 ? (
        <>
          {videos.map((video) => {
            const Component = video.isVoiceOnly ? VoiceOnlyCard : VideoCard;

            return (
              <div key={video.id} className="flex gap-4 items-start">
                <Component {...video}>
                  <>
                    {video.tags.length > 0 && (
                      <div className="flex flex-wrap p-4 pt-0">
                        {video.tags.map((tag) => (
                          <TagLink key={tag} tag={tag} locale={locale} />
                        ))}
                      </div>
                    )}
                    {video.subtitles && (
                      <Subtitle subtitles={video.subtitles} />
                    )}
                  </>
                </Component>
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={isPending}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 focus:ring-2 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-600 disabled:bg-white disabled:border-0 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
              >
                {isPending ? <Loader size={20} /> : t("misc.more")}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="font-sm text-gray-500 text-center">
          {t("video.search.noResult")}
        </p>
      )}
    </main>
  );
};
