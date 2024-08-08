import { db } from "database";

import { get12LabsVideoId, getVideoProcessingStatus, getHLS } from "./utils";

export async function triggerUpdateVideoProcessingTaskStatus({
  twelveLabsIndexId,
}: {
  twelveLabsIndexId: string;
}) {
  let status = await getVideoProcessingStatus(twelveLabsIndexId);

  while (!["ready", "failed"].includes(status)) {
    status = await getVideoProcessingStatus(twelveLabsIndexId);

    console.log("waiting for video ready...", { status });

    await new Promise((resolve) => setTimeout(resolve, 7000));
  }

  await db.twelveLabsVideo.update({
    where: {
      twelveLabsIndexId,
    },
    data: { status: status === "ready" ? "READY" : "FAILED" },
  });
}

export async function triggerSaveMetadataTask({
  videoId,
  twelveLabsIndexId,
}: {
  videoId: string;
  twelveLabsIndexId: string;
}) {
  console.log("start saving video metadata...", { videoId });

  let twelveLabsVideoId = await get12LabsVideoId(twelveLabsIndexId);

  while (!twelveLabsVideoId) {
    twelveLabsVideoId = await get12LabsVideoId(twelveLabsIndexId);

    console.log("(save MD task) waiting for twelveLabsVideoId ready...", {
      twelveLabsVideoId,
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  await db.twelveLabsVideo.update({
    where: { twelveLabsIndexId },
    data: {
      twelveLabsVideoId,
    },
  });

  let hls = await getHLS({ twelveLabsIndexId, twelveLabsVideoId });

  while (!hls) {
    hls = await getHLS({ twelveLabsIndexId, twelveLabsVideoId });

    console.log("waiting for hls ready...", { hls });

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  await db.videoMetadata.update({
    where: { id: videoId },
    data: {
      thumbnailUrl: hls.thumbnailUrls?.[0],
    },
  });
}
