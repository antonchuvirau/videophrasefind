import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

import { getS3DirectoryUrl } from "../../lib/s3";

function getLocalVideoPath(videoId: string) {
  return `./temp/${videoId}.mp4`;
}

export async function cropVideo(videoId: string) {
  return new Promise<{ message: string }>((resolve, reject) => {
    ffmpeg()
      .input(`${getS3DirectoryUrl(videoId)}/video.webm`)
      .setStartTime("00:00:00")
      .setDuration("00:01:00")
      .on("start", (cmd) => {
        console.log("Spawned ffmpeg command: " + cmd);
      })
      .on("end", () => {
        resolve({ message: "Processing with ffmpeg finished!" });
      })
      .on("error", (error) => {
        console.log(error);

        reject(error);
      })
      .save(getLocalVideoPath(videoId));
  });
}

export async function readLocalVideo(videoId: string) {
  return new Promise<File>((resolve, reject) => {
    fs.readFile(getLocalVideoPath(videoId), async (error, data) => {
      if (!error) {
        const blob = new Blob([data], { type: "video/mp4" });

        resolve(new File([blob], videoId, { type: "video/mp4" }));
      } else {
        console.log(error);

        reject(error);
      }
    });
  });
}

export async function deleteLocalVideo(videoId: string) {
  return new Promise<{ message: string }>((resolve, reject) => {
    fs.unlink(getLocalVideoPath(videoId), (error) => {
      if (error) {
        console.log(error);

        reject(error);
      }
      resolve({
        message: `Successfully deleted: ${getLocalVideoPath(videoId)}`,
      });
    });
  });
}
