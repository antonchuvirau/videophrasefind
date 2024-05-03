import { db } from "database";

import { client12Labs } from "../../twelveLabs/client";

export const get12LabsIndexId = async (videoId: string) => {
  return (
    await db.video.findUnique({
      where: { id: videoId },
    })
  )?.twelveLabsIndexId;
};

export const get12LabsVideoId = async (indexId: string) => {
  const [index] = await client12Labs.index.video.list(indexId);

  return index?.id;
};
