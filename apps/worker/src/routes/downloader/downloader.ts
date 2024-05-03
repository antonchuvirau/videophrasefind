import { Hono } from "hono";
import ytdl from "ytdl-core";

import { trigger12LabsTask } from "./tasks";

import { getUploadUrl } from "../../lib/s3";

const app = new Hono();

app.post("/trigger", async (c) => {
  const { url, videoId } = await c.req.json<{
    url: string;
    videoId: string;
  }>();
  trigger12LabsTask({ url, videoId });
  return c.json({ message: "Job triggered" });
});

app.post("/fetch-and-trigger", async (c) => {
  const { url, videoId } = await c.req.json<{
    url: string;
    videoId: string;
  }>();
  console.log("Fetching video", { url, videoId });

  const info = await ytdl.getInfo(url);

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

  const { uploadUrl, downloadUrl } = await getUploadUrl(videoId);

  readable.on("end", async () => {
    console.log("Fetching done, uploading to s3", { downloadUrl });
    
    const blob = new Blob(chunks, { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    // trigger, but not wait, we will wait on a client side using polling
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });
    console.log("Upload done", { downloadUrl });

    // return trigger12LabsTask({ url: downloadUrl, videoId });
    trigger12LabsTask({ url: downloadUrl, videoId });
  });

  return c.json({ videoTitle: info.videoDetails.title });
});

export default app;
