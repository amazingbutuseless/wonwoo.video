import { SubtitleSearch } from "@/components/SubtitleSearch";
import { VideoCard } from "@/components/VideoCard";
import { videos } from "@/data/videos.json";
import { query } from "@/lib/video/subtitle";

const getDefaultVideos: () => Video[] = () => {
  return [...videos].sort(
    (a, b) => Date.parse(b.airedAt) - Date.parse(a.airedAt)
  );
};

export default async function Home({
  searchParams,
}: {
  searchParams: { keyword?: string };
}) {
  let displayVideos = getDefaultVideos();
  const { keyword } = await searchParams;

  if (keyword) {
    const results = await query(keyword);
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
    <>
      <SubtitleSearch />

      <main className="flex flex-col gap-8 mt-4">
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
    </>
  );
}
