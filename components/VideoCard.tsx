/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import dayjs from "dayjs";

export const VideoCard: React.FC<Video> = (video) => {
  return (
    <article
      key={video.id}
      className="block relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
    >
      <Link href={video.url} target="_blank" passHref>
        <img
          src={video.imageUrl || ""}
          alt={video.title}
          className="object-cover w-full"
        />

        <div className="flex flex-col gap-1 p-4">
          <strong>{video.title}</strong>
          <span className="text-sm text-gray-500">
            {dayjs(video.airedAt).format("YYYY-MM-DD HH:mm")}
          </span>
        </div>
      </Link>

      {video.tags.length > 0 && (
        <div className="flex flex-wrap p-4 pt-0">
          {video.tags.map((tag) => (
            <span key={tag} className="text-sm underline">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};
