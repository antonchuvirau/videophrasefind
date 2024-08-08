import { Hono } from "hono";

import { trigger12LabsTask, triggerDownloadAndUploadToS3Task } from "./tasks";

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
  triggerDownloadAndUploadToS3Task({ url, videoId });
  return c.json({ message: "Fetch and trigger job triggered!" });
});

export default app;
