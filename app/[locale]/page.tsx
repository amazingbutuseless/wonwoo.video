import { Loader } from "@/components/Loader";
import { SubtitleSearch } from "@/components/SubtitleSearch";
import { VideoList } from "@/components/VideoList";
import { Suspense } from "react";

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ keyword?: string }>;
}) {
  return (
    <>
      <SubtitleSearch />

      <Suspense
        fallback={
          <div className="flex justify-center items-center">
            <Loader />
          </div>
        }
      >
        <VideoList params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
