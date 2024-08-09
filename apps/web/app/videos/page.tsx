import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Prisma, db } from "database";
import { differenceInHours, intervalToDuration } from "date-fns";

import { padTime } from "@/components/CaptionsEntry";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn, formatDate, formatTime } from "@/lib/utils";

import { Icons } from "@/components/Icons";

function formatDuration(videoDuration: Prisma.Decimal) {
  const duration = intervalToDuration({
    start: 0,
    end: videoDuration.toNumber() * 1000,
  });

  if (!duration.hours)
    return `${padTime(duration.minutes)}:${padTime(duration.seconds)}`;

  return `${padTime(duration.hours)}:${padTime(duration.minutes)}:${padTime(duration.seconds)}`;
}

async function getVideos(userId: string) {
  return db.videoMetadata.findMany({
    where: { userId },
    include: {
      twelveLabsVideos: {
        include: {
          transaction: {
            select: {
              credits: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

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
    <div className="flex w-full max-w-[1000px] flex-col gap-8">
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
                  {formatDuration(video.duration)}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between overflow-hidden">
              {video.title ? (
                <h2 className="truncate text-2xl font-bold">{`${video.title}`}</h2>
              ) : (
                <span className="flex items-center gap-2 text-2xl font-bold">
                  Waiting for a title
                  <Icons.spinner className="size-5 animate-spin" />
                </span>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white/70">
                  <Icons.videoSize strokeWidth={1.5} className="size-5" />
                  <span className="font-semibold">
                    {video.size ? (
                      `${(video.size / 1e6).toFixed(2)}MB`
                    ) : (
                      <Icons.spinner className="size-5 animate-spin" />
                    )}
                  </span>
                </span>
                {video.twelveLabsVideos[0] ? (
                  <>
                    <span className="flex items-center gap-2 text-white/70">
                      <Icons.audioLines strokeWidth={1.5} className="size-5" />
                      <span className="font-semibold">{`${formatDuration(video.twelveLabsVideos[0].duration)} ${!video.twelveLabsVideos[0].full ? "(Cropped)" : "(Full)"}`}</span>
                    </span>
                    {video.twelveLabsVideos[0].transaction &&
                    -1 * video.twelveLabsVideos[0].transaction.credits > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="group">
                            <span className="flex items-center gap-2 text-white/70 underline-offset-4 group-hover:underline">
                              <Icons.handCredits
                                strokeWidth={1.5}
                                className="size-5"
                              />
                              <span className="font-semibold">{`${video.twelveLabsVideos[0].transaction.credits} credits`}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{`The video cost you ${-1 * video.twelveLabsVideos[0].transaction.credits} credits`}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </>
                ) : null}
                <span className="flex items-center gap-2 text-white/70">
                  <Icons.date strokeWidth={1.5} className="size-5" />
                  <time className="font-semibold">{`${formatDate(video.createdAt)} at ${formatTime(video.createdAt)}`}</time>
                </span>
              </div>
              <span className="flex gap-3 font-semibold">
                {`Transcriptions`}:
                {video.twelveLabsVideos[0]?.status === "READY" ? (
                  <span className="flex items-center gap-2 text-emerald-300">
                    ready
                    <Icons.ready className="size-5" />
                  </span>
                ) : null}
                {(!video.twelveLabsVideos[0]?.status ||
                  video.twelveLabsVideos[0]?.status === "PROCESSING") &&
                differenceInHours(new Date(), video.createdAt) < 5 ? (
                  <span className="flex items-center gap-2 text-amber-300">
                    please wait, we&apos;re processing your video
                    <Icons.spinner className="size-5 animate-spin" />
                  </span>
                ) : null}
                {video.twelveLabsVideos[0]?.status === "FAILED" ||
                ((!video.twelveLabsVideos[0] ||
                  video.twelveLabsVideos[0]?.status === "PROCESSING") &&
                  differenceInHours(new Date(), video.createdAt) >= 5) ? (
                  <span className="flex items-center gap-2 text-red-500">
                    error processing the video
                    <Icons.errorProcessingVideo className="size-5" />
                  </span>
                ) : null}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
