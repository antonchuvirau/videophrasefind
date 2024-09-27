"use client";

import { z } from "zod";
import { useMemo, useRef } from "react";
import _ from "lodash";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Controller } from "react-hook-form";
import Link from "next/link";

import CaptionsEntry from "@/components/CaptionsEntry";
import Search from "@/components/Search";
import { Icons } from "@/components/Icons";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import useZodForm from "@/hooks/useZodForm";

import { TranscriptionsSchema } from "@/twelveLabs/utils";

import useRefresher from "@/hooks/useRefresher";
import { useThumbnailer, STEP } from "@/hooks/useThumbnailer";

import Loader from "@/app/video/[id]/loader";

import { getSemanticSearchResult } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Info } from "lucide-react";
import { buttonVariants } from "./ui/button";

export const schema = z.object({
  searchQuery: z.string(),
  semanticSearch: z.boolean(),
});

type MaybeMembershipType<T extends "pro" | "promax"> = T | null | undefined;

interface Props {
  data: TranscriptionsSchema | null;
  videoId: string;
  videoUrl: string | null;
  refreshInterval?: number;
  userMembershipType: MaybeMembershipType<"pro" | "promax">;
  isFullVersion: boolean;
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

function CroppedVideoAlert() {
  return (
    <div className="pb-6">
      <Alert className="rounded-[18px]">
        <Info />
        <AlertTitle>Partial transcript</AlertTitle>
        <AlertDescription>
          Your video has been partially transcribed. Upgrade your account for a
          complete transcript.
          <div className="mt-2 flex justify-center">
            <Link className={buttonVariants()} href="/pricing">
              Become a PRO user
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

const Content = ({
  data,
  videoId,
  videoUrl,
  refreshInterval,
  userMembershipType,
  isFullVersion,
}: Props) => {
  useRefresher({ enabled: !(data && videoUrl), interval: refreshInterval });

  const { thumbnails } = useThumbnailer(videoUrl);

  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    watch,
    control,
    register,
    formState: { errors },
  } = useZodForm({
    schema,
    defaultValues: {
      searchQuery: "",
      semanticSearch: false,
    },
    mode: "onBlur",
  });

  const searchQuery = watch("searchQuery");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  const semanticSearch = watch("semanticSearch");

  const filteredCaptions = useMemo(
    () =>
      data?.parsedCaptions.filter((entry) =>
        entry.text.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [data?.parsedCaptions, searchQuery],
  );

  const semanticResponse = useQuery({
    enabled: semanticSearch && !!debouncedSearchQuery,
    refetchOnWindowFocus: false,
    queryKey: ["semantic", videoId, debouncedSearchQuery],
    queryFn: () => getSemanticSearchResult(videoId, debouncedSearchQuery),
  });

  if (!videoUrl)
    return (
      <Loader message="Waiting for the video. This may take a few minutes" />
    );

  return (
    <div className="grid flex-1 grid-cols-3 gap-10 overflow-hidden rounded-[32px] bg-card p-10">
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
      <div className="flex max-h-[800px] flex-col gap-5 overflow-scroll rounded-[32px]">
        {data ? (
          <>
            <div className="flex items-center justify-center gap-3">
              <Controller
                control={control}
                name="semanticSearch"
                render={({ field: { value, onChange } }) => (
                  <>
                    <Switch
                      id="semanticSearchSwitch"
                      checked={value}
                      onCheckedChange={onChange}
                      disabled={!userMembershipType}
                    />
                    <Label htmlFor="semanticSearchSwitch">
                      Semantic search
                    </Label>
                  </>
                )}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Icons.info className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent className="text-center" sideOffset={12}>
                    {userMembershipType ? (
                      <p>
                        For a general topic search, e.g. &quot;space&quot;{" "}
                        <br />
                        will return results like moon and rocket. <br />
                      </p>
                    ) : (
                      <p>
                        You need to{" "}
                        <Link className="underline" href={"/pricing"}>
                          upgrade your plan
                        </Link>{" "}
                        to use the feature.
                      </p>
                    )}
                    <Link className="underline" href="/about/#semantic-search">
                      Read more about the semantic search feature
                    </Link>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Search
              placeholder={semanticSearch ? "Type your query" : "Filter"}
              name="searchQuery"
              register={register}
              errors={errors}
            />
            {semanticSearch ? (
              <>
                {semanticResponse.isLoading && (
                  <span className="flex justify-center text-center font-semibold">
                    <span className="flex items-center gap-2">
                      <span>Loading</span>
                      <Icons.spinner className="size-4 animate-spin" />
                    </span>
                  </span>
                )}
                {debouncedSearchQuery && !semanticResponse.isLoading && (
                  <span className="text-base font-semibold">
                    {`Results: ${semanticResponse.data?.length ?? 0}`}
                  </span>
                )}
                <div className="overflow-y-auto">
                  {semanticResponse.data?.map((i) => (
                    <CaptionsEntry
                      key={i.entry.from}
                      videoRef={videoRef}
                      entry={i.entry}
                      thumbnailSrc={i.thumbnailSrc}
                      semanticSearchConfidence={i.confidence}
                    />
                  ))}
                  {isFullVersion ? null : <CroppedVideoAlert />}
                </div>
              </>
            ) : (
              <>
                <span className="text-base font-semibold">
                  {`Results: ${filteredCaptions?.length ?? 0}`}
                </span>
                <div className="overflow-y-auto">
                  {filteredCaptions?.map((entry) => (
                    <CaptionsEntry
                      key={entry.from}
                      videoRef={videoRef}
                      entry={entry}
                      thumbnailSrc={
                        thumbnails[Math.floor(entry.from / (STEP * 1000))] ||
                        _.last(thumbnails)
                      }
                    />
                  ))}
                  {isFullVersion ? null : <CroppedVideoAlert />}
                </div>
              </>
            )}
          </>
        ) : (
          <Loader message={getLoaderMessage(videoRef.current?.duration)} />
        )}
      </div>
    </div>
  );
};

export default Content;
