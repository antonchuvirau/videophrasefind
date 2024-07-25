import { db } from "database";
import { getVideoDurationInSeconds } from "get-video-duration";

import { client12Labs } from "../../twelveLabs/client";
import { engine } from "../../twelveLabs/engines";

import { getS3DirectoryUrl } from "../../lib/s3";

import {
  MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE,
  cropAndUploadToS3,
} from "./utils";

import {
  triggerSaveMetadataTask,
  triggerUpdateVideoProcessingTaskStatus,
} from "../../video/tasks";

import {
  calculateCredits,
  transactionDescription,
} from "../../transaction/utils";

async function paidUserHasEnoughCredits(userId: string, duration: number) {
  const creditsAmount = (
    await db.transaction.findMany({
      where: {
        userId,
      },
      select: {
        credits: true,
      },
    })
  ).reduce((acc, current) => acc + current.credits, 0);

  return creditsAmount + calculateCredits(duration) > 0;
}

function isSignedUp(userId: string | null): userId is string {
  return userId !== null;
}

export async function trigger12LabsTask({ videoId }: { videoId: string }) {
  console.log(`Triggering 12Labs task for: ${videoId}`);

  const duration = await getVideoDurationInSeconds(
    `${getS3DirectoryUrl(videoId)}/video.webm`,
    process.env.FFROBE_PATH || "/usr/bin/ffprobe"
  );
  console.log({ duration });

  const { userId } = await db.videoMetadata.update({
    where: {
      id: videoId,
    },
    data: {
      duration,
    },
  });

  const userIsSignedUp = isSignedUp(userId);

  const membership = userIsSignedUp
    ? await db.membership.findUnique({ where: { userId } })
    : null;

  const userIsPaid = userIsSignedUp && !!membership;

  const hasEnoughCredits =
    userIsPaid && (await paidUserHasEnoughCredits(userId, duration));

  const videoShouldBeCropped =
    !userIsSignedUp ||
    (duration > MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE && !userIsPaid) ||
    (duration > MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE &&
      !hasEnoughCredits);

  const index = await client12Labs.index.create({
    name: `${videoShouldBeCropped ? "cropped" : "full"}.${videoId}`,
    engines: engine,
    addons: ["thumbnail"],
  });
  console.log({ indexId: index.id });

  const { twelveLabsIndexId } = await db.twelveLabsVideo.create({
    data: {
      twelveLabsIndexId: index.id,
      videoMetadataId: videoId,
      full: !videoShouldBeCropped,
      duration: videoShouldBeCropped
        ? MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE
        : duration,
    },
  });

  videoShouldBeCropped && (await cropAndUploadToS3(videoId));

  await client12Labs.task.create({
    indexId: twelveLabsIndexId,
    url: `${getS3DirectoryUrl(videoId)}/video${videoShouldBeCropped ? ".cropped" : ""}.webm`,
  });

  if (userIsPaid) {
    await db.transaction.create({
      data: {
        description:
          transactionDescription[videoShouldBeCropped ? "cropped" : "full"],
        credits:
          videoShouldBeCropped || !hasEnoughCredits // add this ternary, because we don't want to have negative balance. Paid user without enough credits === not paid user
            ? 0
            : calculateCredits(duration),
        twelveLabsIndexId,
        userId,
      },
    });
  }

  triggerSaveMetadataTask({ twelveLabsIndexId, videoId });
  triggerUpdateVideoProcessingTaskStatus({ twelveLabsIndexId });
}
