import _ from "lodash";
import { intervalToDuration } from "date-fns";
import { Entry } from "@plussub/srt-vtt-parser/dist/src/types";
import { RefObject } from "react";
import Image from "next/image";

function padTime(time?: number) {
  return _.padStart(time?.toFixed(0), 2, "0");
}

function formatMilliseconds(ms: number) {
  const duration = intervalToDuration({
    start: 0,
    end: ms,
  });
  return `${padTime(duration?.hours)}:${padTime(duration?.minutes)}:${padTime(
    duration?.seconds,
  )}`;
}

export default function CaptionsEntry({
  entry,
  videoRef,
  thumbnailSrc,
}: {
  entry: Entry;
  videoRef: RefObject<HTMLVideoElement>;
  thumbnailSrc?: string;
}) {
  const handleClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = entry.from / 1000;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="mb-2 flex w-full gap-5 overflow-hidden rounded-[18px] p-2 hover:bg-[#394150]"
    >
      <div className="relative aspect-video h-16 rounded-xl bg-[#ffffff1f]">
        {thumbnailSrc && (
          <Image
            fill
            src={thumbnailSrc}
            alt="thumbnail"
            objectFit="contain"
            className="rounded-xl"
          />
        )}
      </div>
      <div className="flex flex-col gap-1 text-left text-sm">
        <div className="grow overflow-hidden overflow-ellipsis font-semibold text-white">
          {entry.text}
        </div>
        <div className="flex w-[max-content] items-center justify-center rounded-md bg-[#9DA3AE] px-2 text-[#101824]">
          {formatMilliseconds(entry.from)}
        </div>
      </div>
    </button>
  );
}
