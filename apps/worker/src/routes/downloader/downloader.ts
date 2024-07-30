import { Hono } from "hono";
import YTDlpWrap from "yt-dlp-wrap";
import { db } from "database";

const ytDlpWrap = new YTDlpWrap(process.env.YT_DLP_PATH || "/usr/bin/yt-dlp");

import { getS3DirectoryUrl, streamToS3 } from "../../lib/s3";

import { trigger12LabsTask } from "./tasks";

const app = new Hono();

app.post("/trigger", async (c) => {
  const { videoId } = await c.req.json<{
    videoId: string;
  }>();
  trigger12LabsTask({ videoId });
  return c.json({ message: "TwelveLabs video upload job triggered!" });
});

async function getVideoAndAudioStreamIds(url: string) {
  const metadata = await ytDlpWrap.execPromise(["-F", url]);

  const filteredRows = metadata
    .split("\n")
    .filter((s) =>
      s.match("((https.*720p|https.*480p)|(audio only.*medium.*))")
    );

  console.log(filteredRows);

  const ids = filteredRows.map((s) => {
    const isAudio = s.includes("audio only");

    return {
      type: isAudio ? "audio" : "video",
      id: s.split(" ")[0],
    };
  });

  console.log(ids);

  return ids;
}

app.post("/fetch-and-trigger", async (c) => {
  const { url, videoId } = await c.req.json<{
    url: string;
    videoId: string;
  }>();
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

  const ids = await getVideoAndAudioStreamIds(url);

  const audioStream = ids.findLast((el) => el.type === "audio");
  const videoStream = ids.find((el) => el.type === "video");

  console.log({ audioStream, videoStream });

  const { upload, passThrough } = streamToS3(videoId, "full");

  ytDlpWrap
    .execStream([
      "-f",
      `${audioStream?.id || "ba"}+${videoStream?.id || "bv"}`,
      url,
    ])
    .pipe(passThrough);

  await upload.done();

  // TODO: file size
  // await db.videoMetadata.update({
  //   where: {
  //     id: videoId,
  //   },
  //   data: {
  //     size: file.size,
  //   },
  // });

  console.log("Upload done", {
    downloadUrl: `${getS3DirectoryUrl(videoId)}/video.webm`,
  });

  trigger12LabsTask({ videoId });

  return c.json({ message: "Fetch and trigger job triggered!" });
});

export default app;
