import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { trigger12LabsTask, triggerDownloadAndUploadToS3Task } from "./tasks";

import YTDlpWrap from "yt-dlp-wrap";

const ytDlpWrap = new YTDlpWrap(process.env.YT_DLP_PATH || "/usr/bin/yt-dlp");

const app = new Hono();

app.post("/validate-resource", async (c) => {
  const { url } = await c.req.json<{
    url: string;
  }>();

  try {
    await ytDlpWrap.execPromise([url, "-s"]);

    return c.json(
      {
        success: true,
        message: "Able to download",
      },
      200
    );
  } catch (error) {
    console.error(error);

    throw new HTTPException(406, {
      message: "Resource is not valid, check the supported resources list",
    });
  }
});

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
