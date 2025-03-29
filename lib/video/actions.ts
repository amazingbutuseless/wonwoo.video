"use server";

import { getVideos, PaginationParams } from "@/lib/video";
import { getVideosWithSubtitles } from "@/lib/video/subtitle";

type Params = Pick<PaginationParams, "cursor"> & {
  tag?: string;
  keyword?: string;
  locale: string;
};

export async function getMoreVideos({ cursor, tag, keyword, locale }: Params) {
  if (keyword) {
    return await getVideosWithSubtitles({ keyword, language: locale, cursor });
  } else {
    return await getVideos({
      tag,
      cursor,
    });
  }
}
