import { db } from "database";

import {
  get12LabsVideoId,
  get12LabsIndexId,
  getVideoProcessingStatus,
  getHLS,
} from "./utils";

export const triggerUpdateVideoProcessingStatusTask = async ({
  videoId,
}: {
  videoId: string;
}) => {
  let twelveLabsIndexId = await get12LabsIndexId(videoId);

  while (!twelveLabsIndexId) {
    twelveLabsIndexId = await get12LabsIndexId(videoId);
    console.log("waiting for index ready...", { twelveLabsIndexId });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  let status = await getVideoProcessingStatus(twelveLabsIndexId);

  while (status !== "ready") {
    status = await getVideoProcessingStatus(twelveLabsIndexId);
    console.log("waiting for video ready...", { status });
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  await db.video.update({ where: { id: videoId }, data: { status: "READY" } });
};

export const triggerSaveMetadataTask = async ({
  videoId,
}: {
  videoId: string;
}) => {
  console.log("start saving video metadata...", { videoId });

  let twelveLabsIndexId = await get12LabsIndexId(videoId);

  while (!twelveLabsIndexId) {
    twelveLabsIndexId = await get12LabsIndexId(videoId);
    console.log("waiting for index ready...", { twelveLabsIndexId });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  let twelveLabsVideoId = await get12LabsVideoId(twelveLabsIndexId);

  while (!twelveLabsVideoId) {
    twelveLabsVideoId = await get12LabsVideoId(twelveLabsIndexId);
    console.log("waiting for videoId ready...", { twelveLabsVideoId });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  await db.video.update({
    where: { id: videoId },
    data: {
      twelveLabsVideoId,
    },
  });

  // const {
  //   metadata: { duration, size },
  // } = await client12Labs.index.video.retrieve(
  //   twelveLabsIndexId,
  //   twelveLabsVideoId
  // );

  // await db.video.update({
  //   where: { id: videoId },
  //   data: {
  //     duration,
  //     size,
  //   },
  // });

  let hls = await getHLS({ twelveLabsIndexId, twelveLabsVideoId });

  while (!hls) {
    hls = await getHLS({ twelveLabsIndexId, twelveLabsVideoId });
    console.log("waiting for hls ready...", { hls });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  await db.video.update({
    where: { id: videoId },
    data: {
      thumbnailUrl: hls.thumbnailUrls?.[0],
    },
  });
};
