import { query } from "@/lib/video/subtitle";
import { VideoCard } from "./VideoCard";
import { getDefaultVideos } from "@/lib/video";

export async function VideoList({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ keyword?: string }>;
}) {
  let displayVideos = getDefaultVideos();
  const { locale } = await params;
  const { keyword } = await searchParams;

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
        displayVideos.map((video) => (
          <div key={video.id} className="flex gap-4 items-start">
            <VideoCard {...video} />
          </div>
        ))
      ) : (
        <p className="font-sm text-gray-500 text-center">
          검색 결과가 없습니다.
        </p>
      )}
    </main>
  );
}
