import { Hono } from "hono";
import ytdl from "ytdl-core";
import { db } from "database";

import { getS3DirectoryUrl, getUploadUrl } from "../../lib/s3";

import { trigger12LabsTask } from "./tasks";

const app = new Hono();

app.post("/trigger", async (c) => {
  const { videoId } = await c.req.json<{
    videoId: string;
  }>();
  trigger12LabsTask({ videoId });
  return c.json({ message: "TwelveLabs video upload job triggered!" });
});

app.post("/fetch-and-trigger", async (c) => {
  const { url, videoId } = await c.req.json<{
    url: string;
    videoId: string;
  }>();
  console.log("Fetching video", { url, videoId });

  const info = await ytdl.getInfo(url);

  await db.videoMetadata.update({
    where: {
      id: videoId,
    },
    data: {
      title: info.videoDetails.title,
    },
  });

  const format = ytdl.chooseFormat(info.formats, {
    quality: "22", // iTag value: resolution=720p, container=mp4, ...
    filter: "audioandvideo", // include audio, not only video
  });

  const filename = info.videoDetails.title.replaceAll(" ", "").trim();

  const mimeType = format.mimeType;

  let chunks: BlobPart[] = [];

  const readable = ytdl.downloadFromInfo(info, { format });

  readable.on("data", (chunk) => {
    chunks.push(chunk);
  });

  readable.on("end", async () => {
    console.log("Fetching done, uploading to s3", {
      downloadUrl: `${getS3DirectoryUrl(videoId)}/video.webm`,
    });

    const blob = new Blob(chunks, { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    await db.videoMetadata.update({
      where: {
        id: videoId,
      },
      data: {
        size: file.size,
      },
    });

    await fetch(await getUploadUrl(videoId, "full"), {
      method: "PUT",
      body: file,
    });

    console.log("Upload done", {
      downloadUrl: `${getS3DirectoryUrl(videoId)}/video.webm`,
    });

    trigger12LabsTask({ videoId });
  });

  return c.json({ message: "Fetch and trigger job triggered!" });
});

export default app;
