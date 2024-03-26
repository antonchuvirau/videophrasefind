import Bluebird from "bluebird";
import _ from "lodash";
import { useEffect, useState } from "react";

// Most of this code was copy-pasted
// TODO: refactor
function videoScreenshotGetter(videoEl: HTMLVideoElement) {
  let internals = {
    videoEl,
    videoDuration: videoEl.duration,
  };

  return {
    get({ time }: { time: number }) {
      return new Promise<string>((resolve, rejectGet) => {
        if (time < 0 || time > internals.videoDuration) {
          rejectGet(`Time "${time}" is not valid.`);
        }

        internals.videoEl.onseeked = function () {
          const canvas = document.createElement("canvas");
          canvas.width = 120; //internals.videoEl.videoWidth;
          canvas.height =
            (canvas.width / internals.videoEl.videoWidth) *
            internals.videoEl.videoHeight;
          const ctx = canvas.getContext("2d");
          console.log(canvas.width, canvas.height);
          ctx?.drawImage(internals.videoEl, 0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL());
        };

        internals.videoEl.currentTime = time;
      });
    },
    info: {
      videoDuration: internals.videoDuration,
    },
  };
}

export function createVideoElement(src: string) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = function () {
      resolve(video);
    };
    video.onerror = function (e) {
      reject(e);
    };
  });
}

export async function getVideoThumbnail(src: string, time: number) {
  const videoElement = await createVideoElement(src);
  const getter = videoScreenshotGetter(videoElement);
  return getter.get({ time });
}

export const throttledGetVideoThumbnail = _.throttle(getVideoThumbnail, 1500);

export const STEP = 5;

export function useThumbnailer(src: string | null) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  useEffect(() => {
    if (src) {
      (async () => {
        const videoElement = await createVideoElement(src);
        const getter = videoScreenshotGetter(videoElement);
        await Bluebird.mapSeries(
          _.range(0, videoElement.duration, STEP),
          async (time) => {
            console.log("Generating thumbnail for", src, time);
            const thumbnail = await getter.get({ time });
            setThumbnails((v) => [...v, thumbnail]);
          },
        );
      })();
    }
  }, [setThumbnails, src]);

  return { thumbnails };
}
