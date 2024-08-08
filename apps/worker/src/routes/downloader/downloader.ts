import { Hono } from "hono";
import YTDlpWrap from "yt-dlp-wrap";
import { db } from "database";
import ffmpeg from "fluent-ffmpeg";
import { spawn } from "node:child_process";

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

async function getVideoAndAudioStreamID(url: string) {
  const formats = await ytDlpWrap.execPromise(["-F", url]);

  const filteredFormats = formats
    .split("\n")
    .filter((s) =>
      s.match(/((https.*720p|https.*480p)|(audio only.*medium.*))/)
    );
  console.log(filteredFormats);

  return filteredFormats.map(
    (s) =>
      ({
        type: s.includes("audio only") ? "audio" : "video",
        id: s.split(" ")[0],
      }) as const
  );
}

export async function triggerBgJob({
  url,
  videoId,
}: {
  url: string;
  videoId: string;
}) {
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

  const ids = await getVideoAndAudioStreamID(url);
  console.log(ids);

  const audioStream = ids.findLast((el) => el.type === "audio");
  const videoStream = ids.find((el) => el.type === "video");

  console.log({ audioStream, videoStream });

  const { upload, passThrough } = streamToS3(videoId, "full");

  // Example command for testing
  // yt-dlp "https://www.youtube.com/watch?v=8GhFmQPZAlo" -f bestvideo+bestaudio --merge-output-format mkv -o - |
  // ffmpeg -i pipe:0 -movflags frag_keyframe+empty_moov  -c copy -f mp4 pipe:1 |
  // mpv -

  // Not using yt-dlp-wrap to narrow down error surface here, probably shoud just get rid of extra dependency
  const ytDlpStream = spawn(process.env.YT_DLP_PATH || "/usr/bin/yt-dlp", [
    url,
    "-f",
    `${audioStream?.id || "ba"}+${videoStream?.id || "bv"}`,
    "--merge-output-format",
    "mkv", // MKV (matroska) stream is the only one that reliably (?) contains video & audio
    "-o",
    "-",
  ]);

  ytDlpStream.stderr.on("data", (data: Buffer) =>
    console.warn(data.toString())
  );

  // MKV is not supported by browsers (and it's also a data stream that is missing headers and metadata),
  // so we use mp4 muxer to convert it to a full-ass mp4 file
  ffmpeg(ytDlpStream.stdout)
    .addOptions(["-movflags frag_keyframe+empty_moov", "-c copy", "-f mp4"])
    .pipe(passThrough);

  await upload.done();

  const downloadUrl = `${getS3DirectoryUrl(videoId)}/video.webm`;

  console.log("Upload done", {
    downloadUrl,
  });

  const response = await fetch(downloadUrl, { method: "HEAD" });
  const contentLengthBytes = response.headers.get("Content-Length");

  await db.videoMetadata.update({
    where: {
      id: videoId,
    },
    data: {
      size: contentLengthBytes ? +contentLengthBytes : undefined,
    },
  });

  trigger12LabsTask({ videoId });
}

app.post("/fetch-and-trigger", async (c) => {
  const { url, videoId } = await c.req.json<{
    url: string;
    videoId: string;
  }>();

  triggerBgJob({ url, videoId });

  return c.json({ message: "Fetch and trigger job triggered!" });
});

export default app;
