import ffmpeg from "fluent-ffmpeg";
import { spawn } from "node:child_process";
import { db } from "database";
import { getVideoDurationInSeconds } from "get-video-duration";

import { getS3DirectoryUrl, streamToS3 } from "../../lib/s3";

import { client12Labs } from "../../twelveLabs/client";
import { engine } from "../../twelveLabs/engines";

import {
  cropAndUploadToS3,
  getVideoAndAudioStreamID,
  MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE,
} from "./utils";

import {
  triggerSaveMetadataTask,
  triggerUpdateVideoProcessingTaskStatus,
} from "../../video/tasks";

import {
  calculateCredits,
  transactionDescription,
} from "../../transaction/utils";

import YTDlpWrap from "yt-dlp-wrap";

const ytDlpWrap = new YTDlpWrap(process.env.YT_DLP_PATH || "/usr/bin/yt-dlp");

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

export async function triggerDownloadAndUploadToS3Task({
  url,
  videoId,
}: {
  url: string;
  videoId: string;
}) {
  console.log("Fetching video", { url, videoId });

  const metadata = await ytDlpWrap.getVideoInfo([url, "-f", "mp4"]);
  const title: string = metadata.title;

  await db.videoMetadata.update({
    where: {
      id: videoId,
    },
    data: {
      title,
    },
  });

  const ids = await getVideoAndAudioStreamID(url);
  console.log(ids);

  const audioStream = ids.findLast((el) => el.type === "audio");
  const videoStream = ids.find((el) => el.type === "video");

  console.log({ audioStream, videoStream });

  const { upload, passThrough } = streamToS3(videoId, "full");

  // Example command for testing
  // yt-dlp "https://www.youtube.com/watch?v=8GhFmQPZAlo" -f bestvideo+bestaudio --merge-output-format mkv -o - |
  // ffmpeg -i pipe:0 -movflags frag_keyframe+empty_moov  -c copy -f mp4 pipe:1 |
  // mpv -

  // Not using yt-dlp-wrap to narrow down error surface here, probably shoud just get rid of extra dependency
  const ytDlpStream = spawn(process.env.YT_DLP_PATH || "/usr/bin/yt-dlp", [
    url,
    "-f",
    `${audioStream?.id || "ba"}+${videoStream?.id || "bv"}`,
    "--merge-output-format",
    "mkv", // MKV (matroska) stream is the only one that reliably (?) contains video & audio
    "-o",
    "-",
  ]);

  ytDlpStream.stderr.on("data", (data: Buffer) =>
    console.warn(data.toString())
  );

  // MKV is not supported by browsers (and it's also a data stream that is missing headers and metadata),
  // so we use mp4 muxer to convert it to a full-ass mp4 file
  ffmpeg(ytDlpStream.stdout)
    .addOptions(["-movflags frag_keyframe+empty_moov", "-c copy", "-f mp4"])
    .pipe(passThrough);

  await upload.done();

  const downloadUrl = `${getS3DirectoryUrl(videoId)}/video.webm`;

  console.log("Upload done", {
    downloadUrl,
  });

  const response = await fetch(downloadUrl, { method: "HEAD" });
  const contentLengthBytes = response.headers.get("Content-Length");

  await db.videoMetadata.update({
    where: {
      id: videoId,
    },
    data: {
      size: contentLengthBytes ? +contentLengthBytes : undefined,
    },
  });

  trigger12LabsTask({ videoId });
}
