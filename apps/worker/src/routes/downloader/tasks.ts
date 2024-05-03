import { db } from "database";

import { client12Labs } from "../../twelveLabs/client";

import { engine } from "../../twelveLabs/engines";

export async function trigger12LabsTask({
  url,
  videoId,
}: {
  url: string;
  videoId: string;
}) {
  console.log("Triggering ", { url, videoId });

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
    url,
  });

  console.log({ task });

  return task;
}
