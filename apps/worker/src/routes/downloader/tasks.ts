import { db } from "database";

import { client12Labs } from "../../twelveLabs/client";
import { engine } from "../../twelveLabs/engines";

import { getS3DirectoryUrl } from "../../lib/s3";

// import { MAX_SECONDS_ALLOWED_TO_TRANCRIBE_FOR_FREE } from "./utils";

export async function trigger12LabsTask({ videoId }: { videoId: string }) {
  console.log(`Triggering 12Labs task for: ${{ videoId }}`);

  // const duration = await getVideoDurationInSeconds(`${getS3DirectoryUrl(videoId)}/video.webm`)

  const index = await client12Labs.index.create({
    name: videoId, // = `${duration > MAX_SECONDS_ALLOWED_TO_TRANCRIBE_FOR_FREE ? "cropped" : "full"}.${videoId}`;
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

  // if (duration > MAX_ALLOWED_SECONDS) {
  //   await cropAndUpload(videoId);

  //   await client12Labs.task.create({
  //     indexId: index.id,
  //     url: `${getS3DirectoryUrl(videoId)}/video.cropped.webm`,
  //   });
  // } else {
  //   await client12Labs.task.create({
  //     indexId: index.id,
  //     url: `${getS3DirectoryUrl(videoId)}/video.webm`,
  //   });
  // }

  const task = await client12Labs.task.create({
    indexId: index.id,
    url: `${getS3DirectoryUrl(videoId)}/video.webm`,
  });
  console.log({ task });
}
