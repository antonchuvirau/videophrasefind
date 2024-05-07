import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

import { getUploadUrl, getS3DirectoryUrl } from "../../lib/s3";

const MIME_TYPE = "mp4";

export const MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE = 60 * 1;

function getLocalVideoPath(videoId: string) {
  return `./temp/${videoId}.${MIME_TYPE}`;
}

export async function cropAndUpload(videoId: string) {
  try {
    const cropVideoResponse = await cropVideo(videoId);
    console.log({ ...cropVideoResponse });

    const file = await readLocalVideoFile(videoId);
    console.log({ message: "Finish reading file" });

    await fetch(await getUploadUrl(videoId, "cropped"), {
      method: "PUT",
      body: file,
    });
    console.log({ message: "Finish uploading to s3" });
  } catch (error) {
    console.log(error);
  } finally {
    const deleteLocalVideoResponse = await deleteLocalVideoFile(videoId);
    console.log({ ...deleteLocalVideoResponse });
  }
}

async function cropVideo(videoId: string) {
  return new Promise<{ message: string }>((resolve, reject) => {
    ffmpeg()
      .input(`${getS3DirectoryUrl(videoId)}/video.webm`)
      .setStartTime("00:00:00")
      .setDuration(
        `00:${`${MAX_SECONDS_ALLOWED_TO_TRANSCRIBE_FOR_FREE / 60}`.padStart(2, "0")}:00`
      )
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

async function readLocalVideoFile(videoId: string) {
  return new Promise<File>((resolve, reject) => {
    fs.readFile(getLocalVideoPath(videoId), async (error, data) => {
      if (!error) {
        const blob = new Blob([data], { type: MIME_TYPE });

        resolve(new File([blob], videoId, { type: MIME_TYPE }));
      } else {
        console.log(error);

        reject(error);
      }
    });
  });
}

async function deleteLocalVideoFile(videoId: string) {
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
