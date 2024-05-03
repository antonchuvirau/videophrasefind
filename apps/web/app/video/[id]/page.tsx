import _ from "lodash";
import { type Metadata } from "next";

import Content from "@/components/Content";

import {
  getVideoUrl,
  getVideoProcessingStatus,
  getVideo12LabsIds,
} from "@/app/video-actions";

import { client12Labs } from "@/twelveLabs/client";
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
  const status = await getVideoProcessingStatus(videoId);

  if (status !== "READY") return { ready: false, data: null };

  const { twelveLabsVideoId, twelveLabsIndexId } =
    await getVideo12LabsIds(videoId);

  if (!twelveLabsVideoId || !twelveLabsIndexId)
    return { ready: false, data: null };

  const transcriptions = await client12Labs.index.video.transcription(
    twelveLabsIndexId,
    twelveLabsVideoId,
  );

  return { ready: true, data: transcriptionsSchema.parse(transcriptions) };
}

export default async function VideoPage({ params: { id } }: Props) {
  const [videoUrl, { data }] = await Promise.all([
    getVideoUrl(id),
    getTranscriptions(id),
  ]);

  return <Content videoUrl={videoUrl} videoId={id} data={data} />;
}
