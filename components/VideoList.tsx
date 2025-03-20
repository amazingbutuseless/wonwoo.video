import { getTranslations } from "next-intl/server";

import { query } from "@/lib/video/subtitle";
import { getDefaultVideos } from "@/lib/video";

import { VideoCard } from "./VideoCard";
import { VoiceOnlyCard } from "./VoiceOnlyCard";
import { Subtitle } from "./Subtitle";
import { TagLink } from "./TagLink";

type Props = {
  locale: string;
  keyword?: string;
  tag?: string;
};

export async function VideoList({ locale, keyword, tag }: Props) {
  const t = await getTranslations("video.search");

  let displayVideos = getDefaultVideos();

  if (tag) {
    displayVideos = displayVideos.filter((video) => video.tags.includes(tag));
  }

  if (keyword) {
    const results = await query(keyword, locale);
    const videoIds = new Set(results.map((result) => result.videoId));
    displayVideos = displayVideos.filter((video) => videoIds.has(video.id));
    displayVideos.forEach((video) => {
      const descriptions = results.filter(
        (result) => result.videoId === video.id
      );
      video.subtitles = descriptions;
    });
  } else {
    displayVideos = displayVideos.map((video) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { subtitles, ...rest } = video;
      return rest;
    });
  }

  return (
    <main className="flex flex-col gap-4 m-4">
      {displayVideos.length > 0 ? (
        displayVideos.map((video) => {
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
                  {video.subtitles && <Subtitle subtitles={video.subtitles} />}
                </>
              </Component>
            </div>
          );
        })
      ) : (
        <p className="font-sm text-gray-500 text-center">{t("noResult")}</p>
      )}
    </main>
  );
}
