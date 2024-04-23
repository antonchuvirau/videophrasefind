import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Prisma, db } from "database";
import { intervalToDuration } from "date-fns";

import { padTime } from "@/components/CaptionsEntry";

import { formatDate, formatTime } from "@/lib/utils";

import { Icons } from "@/components/Icons";

const formatVideoDuration = (videoDuration: Prisma.Decimal) => {
  const duration = intervalToDuration({
    start: 0,
    end: videoDuration.toNumber() * 1000,
  });

  if (!duration.hours)
    return `${padTime(duration.minutes)}:${padTime(duration.seconds)}`;

  return `${padTime(duration.hours)}:${padTime(duration.minutes)}:${padTime(duration.seconds)}`;
};

const getVideos = async (userId: string) => {
  return db.video.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export default async function VideosPage() {
  const { userId } = auth().protect();

  const videos = await getVideos(userId);

  if (videos.length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-5">
        <h1 className="text-xl font-bold">
          You don&apos;t have any uploaded videos yet
        </h1>
        <Icons.sadFace className="size-14" />
      </div>
    );

  return (
    <div className="flex w-full max-w-[950px] flex-col gap-8">
      {videos.map((video) => (
        <Link key={video.id} href={`/video/${video.id}`}>
          <div className="flex gap-10 rounded-2xl bg-[#0b111a] p-10">
            <div className="relative flex aspect-video h-[8.5rem] items-center justify-center rounded-xl border border-purple-200 bg-[#ffffff1f]">
              {video.thumbnailUrl ? (
                <Image
                  fill
                  src={video.thumbnailUrl}
                  alt="thumbnail"
                  className="rounded-xl object-contain"
                />
              ) : (
                <Icons.spinner className="size-5 animate-spin" />
              )}
              {video.duration && (
                <div className="absolute bottom-1 right-1 rounded-md bg-black/65 p-1 text-sm">
                  {formatVideoDuration(video.duration)}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between overflow-hidden">
              <h2 className="truncate text-2xl font-bold">{`${video.title}`}</h2>
              <div className="flex items-center justify-between">
                <span className="flex gap-2 text-white/70">
                  <Icons.videoSize strokeWidth={1.5} className="size-5" />
                  <span className="flex items-center font-semibold">
                    {video.size ? (
                      `${(video.size / 1e6).toFixed(2)}MB`
                    ) : (
                      <Icons.spinner className="size-5 animate-spin" />
                    )}
                  </span>
                </span>
                <span className="flex gap-2 text-white/70">
                  <Icons.date strokeWidth={1.5} className="size-5" />
                  <time className="font-semibold">{`${formatDate(video.createdAt)} at ${formatTime(video.createdAt)}`}</time>
                </span>
              </div>
              <span className="flex gap-3 font-semibold">
                Transcriptions:
                {video.status === "PROCESSING" ? (
                  <span className="flex items-center gap-2 text-amber-300">
                    please wait, we&apos;re processing your video
                    <Icons.spinner className="size-5 animate-spin" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-300">
                    ready
                    <Icons.ready className="size-5" />
                  </span>
                )}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
