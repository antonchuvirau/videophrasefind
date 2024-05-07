import { db } from "database";

import { client12Labs } from "../../twelveLabs/client";

export const get12LabsIndexId = async (videoId: string) => {
  return (
    await db.videoMetadata.findUnique({
      where: { id: videoId },
    })
  )?.twelveLabsIndexId;
};

export const get12LabsVideoId = async (indexId: string) => {
  const [video] = await client12Labs.index.video.list(indexId);

  return video?.id;
};

export const getVideoProcessingStatus = async (indexId: string) => {
  return (await client12Labs.task.list({ indexId }))[0]?.status;
};

export const getHLS = async ({
  twelveLabsIndexId,
  twelveLabsVideoId,
}: {
  twelveLabsIndexId: string;
  twelveLabsVideoId: string;
}) => {
  return (
    await client12Labs.index.video.retrieve(
      twelveLabsIndexId,
      twelveLabsVideoId
    )
  ).hls;
};
