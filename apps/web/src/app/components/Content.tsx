"use client";

import { z } from "zod";
import { useMemo, useRef } from "react";
import _ from "lodash";

import CaptionsEntry from "@/app/components/CaptionsEntry";
import Search from "@/app/components/Search";

import useZodForm from "@/app/hooks/useZodForm";

import { TranscriptionsSchema } from "@/app/twelveLabs/utils";

import useRefresher from "@/app/utils/useRefresher";
import { useThumbnailer, STEP } from "@/app/utils/thumbnailer";

import Loader from "@/app/video/[s3DirectoryPath]/loader";

export const schema = z.object({
  searchQuery: z.string(),
});

interface Props {
  data: TranscriptionsSchema | null;
  videoUrl: string | null;
  refreshInterval?: number;
}

function getLoaderMessage(videoDurationSeconds?: number) {
  if (!videoDurationSeconds) return "Waiting for transcription results.";
  if (videoDurationSeconds < 60 * 5)
    return "Waiting for transcription results, it's gonna take a minute or two";
  if (videoDurationSeconds < 60 * 10)
    return "Waiting for transcription results, it may take up to 5 minutes";
  if (videoDurationSeconds < 60 * 30)
    return "Waiting for transcription results, it may take up to 15 minutes. You can save this link and come back later!";
  return "Waiting for transcription results. Your video is pretty large, it make take some time (up to half of the video duration). You can save this link and come back later!";
}

const Content = ({ data, videoUrl, refreshInterval }: Props) => {
  useRefresher({ enabled: !(data && videoUrl), interval: refreshInterval });

  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    watch,
    register,
    formState: { errors },
  } = useZodForm({
    schema,
    defaultValues: {
      searchQuery: "",
    },
    mode: "onBlur",
  });

  const { thumbnails } = useThumbnailer(videoUrl);

  const searchQuery = watch("searchQuery");

  const filteredCaptions = useMemo(
    () =>
      data?.parsedCaptions.filter((entry) =>
        entry.text.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [data?.parsedCaptions, searchQuery],
  );

  if (!videoUrl)
    return (
      <Loader message="Waiting for the video. This may take a few minutes" />
    );

  return (
    <div className="grid flex-1 grid-cols-3 gap-10 overflow-hidden rounded-[32px] bg-[#212A36] p-10">
      <div className="col-span-2">
        <div className="rounded-2xl bg-[#ffffff1f] p-2">
          <video
            ref={videoRef}
            preload="auto"
            autoPlay
            muted
            controls
            className="max-h-fit w-full overflow-hidden rounded-xl"
          >
            <source src={videoUrl} type="application/ogg" />
            {data && (
              <track
                label="English"
                kind="subtitles"
                srcLang="en"
                src={`data:text/vtt;charset=UTF-8,${encodeURIComponent(
                  data.captionsVtt,
                )}`}
                default
              />
            )}
          </video>
        </div>
      </div>
      <div className="overflow-scrolls flex max-h-[800px] flex-col gap-5 rounded-[32px]">
        {data ? (
          <>
            <Search
              placeholder="Filter"
              name="searchQuery"
              register={register}
              errors={errors}
            />
            <div className="text-base font-semibold text-white">
              Results: {filteredCaptions?.length || 0}
            </div>
            <div className="overflow-y-auto">
              {filteredCaptions?.map((entry) => {
                return (
                  <CaptionsEntry
                    key={entry.from}
                    videoRef={videoRef}
                    entry={entry}
                    thumbnailSrc={
                      thumbnails[Math.floor(entry.from / (STEP * 1000))] ||
                      _.last(thumbnails)
                    }
                  />
                );
              })}
            </div>
          </>
        ) : (
          <Loader message={getLoaderMessage(videoRef.current?.duration)} />
        )}
      </div>
    </div>
  );
};

export default Content;
