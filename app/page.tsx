import { Calendar } from "@/components/Calendar";
import { VideoCard } from "@/components/VideoCard";
import { videos } from "@/data/videos.json";

export default function Home() {
  videos.sort((a, c) => Date.parse(c.airedAt) - Date.parse(a.airedAt));

  return (
    <main className="flex flex-col gap-8">
      {(videos || []).map((video) => (
        <div key={video.id} className="flex gap-4 items-start">
          <Calendar airedAt={video.airedAt} />
          <VideoCard {...video} />
        </div>
      ))}
    </main>
  );
}
