import { db } from "database";

import { client12Labs } from "../../twelveLabs/client";
import { engine } from "../../twelveLabs/engines";

import { getS3DirectoryUrl } from "../../lib/s3";

export async function trigger12LabsTask({ videoId }: { videoId: string }) {
  console.log("Triggering ", {
    url: `${getS3DirectoryUrl(videoId)}/video.webm`,
    videoId,
  });

  const index = await client12Labs.index.create({
    name: videoId,
    engines: engine,
    addons: ["thumbnail"],
  });

  console.log({ index });

  await db.video.update({
    where: {
      id: videoId,
    },
    data: {
      twelveLabsIndexId: index.id,
    },
  });

  const task = await client12Labs.task.create({
    indexId: index.id,
    url: `${getS3DirectoryUrl(videoId)}/video.webm`,
  });

  console.log({ task });

  return task;
}
