import { Hono } from "hono";
import ytdl from "ytdl-core";
import { db } from "database";

import { trigger12LabsTask } from "./tasks";

import {
  getS3DirectoryUrl,
  getCroppedUploadUrl,
  getUploadUrl,
} from "../../lib/s3";

import ffmpeg from "fluent-ffmpeg";

import fs from "fs";

const app = new Hono();

function deleteFile(file: string) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, (err) => {
      if (err) reject(err);
      resolve(`Successfully deleted: ${file}`);
    });
  });
}

function cropAndUpload(videoId: string) {
  const tempLocalVideoPath = `./temp/${videoId}.mp4`;

  ffmpeg()
    .input(`${getS3DirectoryUrl(videoId)}/video.webm`)
    .setStartTime("00:00:00")
    .setDuration("00:01:00")
    .on("start", (cmd) => {
      console.log("Spawned ffmpeg command: " + cmd);
    })
    .on("end", () => {
      console.log("Processing with ffmpeg finished!");

      fs.readFile(tempLocalVideoPath, async (error, data) => {
        if (!error) {
          const blob = new Blob([data], { type: "video/mp4" });
          const file = new File([blob], videoId, { type: "video/mp4" });

          await fetch(await getCroppedUploadUrl(videoId), {
            method: "PUT",
            body: file,
          });

          console.log("Uploading to S3 finished");

          try {
            const response = await deleteFile(tempLocalVideoPath);
            console.log(response);
          } catch (error) {
            console.log(error);
          }
        } else {
          console.log(error);
        }
      });
    })
    .on("error", (err) => {
      console.log("An error occurred: " + err.message);
    })
    .save(tempLocalVideoPath);
}

app.get("/crop-and-upload", async (c) => {
  // cropAndUpload("clvqv8rb50000baqobltklw28");
  cropAndUpload("clvqukcoa0004xb06epbjzg7w");

  return c.json({ message: "Hello World!" });
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
  console.log("Fetching video", { url, videoId });

  const info = await ytdl.getInfo(url);

  await db.video.update({
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

    await fetch(await getUploadUrl(videoId), {
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
