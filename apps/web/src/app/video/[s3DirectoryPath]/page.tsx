import _ from "lodash";
import { type Metadata } from "next";

import Content from "@/app/components/Content";

import { getVideoUrl } from "@/app/actions";
import { client12Labs } from "@/app/twelveLabs/client";
import { transcriptionsSchema } from "@/app/twelveLabs/utils";

interface Props {
  params: {
    s3DirectoryPath: string;
  };
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Transcription",
  description:
    "Here you can see your transcribed video and search for keywords without watching the video",
};

async function getTranscriptions(indexName: string) {
  const [index] = await client12Labs.index.list({ name: indexName });
  console.log({ index, indexName });
  if (!index) return { ready: false, data: null };

  const [task] = await client12Labs.task.list({ indexId: index.id });
  console.log({ task });
  if (!task) return { ready: false, data: null };

  if (task.status !== "ready")
    return {
      ready: false,
      estimatedTime: task.estimatedTime,
      data: null,
    };

  const [video] = await client12Labs.index.video.list(index.id);
  console.log({ video });
  const result = await client12Labs.index.video.transcription(
    index.id,
    video.id,
  );

  const data = transcriptionsSchema.parse(result);
  return { ready: true, data };
}

export default async function VideoPage({
  params: { s3DirectoryPath },
}: Props) {
  const [videoUrl, { data }] = await Promise.all([
    getVideoUrl(s3DirectoryPath),
    getTranscriptions(s3DirectoryPath),
  ]);

  return <Content videoUrl={videoUrl} data={data} />;
}
