import { db } from "database";
import { getVideoDurationInSeconds } from "get-video-duration";

import { client12Labs } from "../../twelveLabs/client";
import { engine } from "../../twelveLabs/engines";

import { getS3DirectoryUrl } from "../../lib/s3";

import {
  MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE,
  cropAndUploadToS3,
} from "./utils";

export async function trigger12LabsTask({ videoId }: { videoId: string }) {
  console.log(`Triggering 12Labs task for: ${{ videoId }}`);

  const duration = await getVideoDurationInSeconds(
    `${getS3DirectoryUrl(videoId)}/video.webm`
  );
  console.log({ duration });

  await db.video.update({
    where: {
      id: videoId,
    },
    data: {
      duration,
    },
  });

  const index = await client12Labs.index.create({
    name: `${duration > MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE ? "cropped" : "full"}.${videoId}`,
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

  if (duration > MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE) {
    await cropAndUploadToS3(videoId);

    await client12Labs.task.create({
      indexId: index.id,
      url: `${getS3DirectoryUrl(videoId)}/video.cropped.webm`,
    });
  } else {
    await client12Labs.task.create({
      indexId: index.id,
      url: `${getS3DirectoryUrl(videoId)}/video.webm`,
    });
  }
}
