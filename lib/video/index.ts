import { videos } from "@/data/videos.json";

export const getDefaultVideos: () => Video[] = () => {
  return [...videos].sort(
    (a, b) => Date.parse(b.airedAt) - Date.parse(a.airedAt)
  );
};
