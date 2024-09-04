import _ from "lodash";
import { type Metadata } from "next";
import { db } from "database";
import { auth } from "@clerk/nextjs/server";

import Content from "@/components/Content";

import {
  getVideoUrl,
  get12LabsVideoIds,
  get12LabsVideoProcessingStatus,
} from "@/app/video-actions";

// import { client12Labs } from "@/twelveLabs/client";
import { transcriptionsSchema } from "@/twelveLabs/utils";

interface Props {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Transcription",
  description:
    "Here you can see your transcribed video and search for keywords without watching the video",
};

async function getTranscriptions(videoId: string) {
  const status = await get12LabsVideoProcessingStatus(videoId);

  if (status !== "READY") return { ready: false, data: null };

  const ids = await get12LabsVideoIds(videoId);

  if (!ids?.twelveLabsVideoId) return { ready: false, data: null };

  // const transcriptions = await client12Labs().index.video.transcription(
  //   ids.twelveLabsIndexId,
  //   ids.twelveLabsVideoId,
  // );

  const url = `https://api.twelvelabs.io/v1.2/indexes/${ids.twelveLabsIndexId}/videos/${ids.twelveLabsVideoId}/transcription`;
  const options: Parameters<typeof fetch>[1] = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": process.env.TWELVE_LABS_API_KEY!,
      "Content-Type": "application/json",
      cache: "no-cache",
    },
  };

  const res = await fetch(url, options);

  const { data: transciptions } = await res.json();

  return { ready: true, data: transcriptionsSchema.parse(transciptions) };
}

export default async function VideoPage({ params: { id } }: Props) {
  const { userId } = auth();

  const membershipType = userId
    ? await db.membership.findUnique({
        where: {
          userId,
        },
        select: {
          type: true,
        },
      })
    : null;

  const isFullVersion =
    (await db.twelveLabsVideo.count({
      where: {
        videoMetadata: {
          id,
        },
        full: true,
      },
    })) > 0;

  const [videoUrl, { data }] = await Promise.all([
    getVideoUrl(id),
    getTranscriptions(id),
  ]);

  return (
    <Content
      videoUrl={videoUrl}
      videoId={id}
      data={data}
      userMembershipType={membershipType?.type}
      isFullVersion={isFullVersion}
    />
  );
}
