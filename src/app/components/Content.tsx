"use client";
import Image from "next/image";
import { z } from "zod";
import { parse } from "@plussub/srt-vtt-parser";
import { useQuery } from "@tanstack/react-query";
import Search from "./Search";
import useZodForm from "../hooks/useZodForm";
import { useMemo } from "react";
import _ from "lodash";

export const schema = z.object({
  searchQuery: z.string(),
});

function padTime(time: number) {
  return _.padStart(time.toFixed(0), 2, "0");
}

function msToTime(s: number) {
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;
  return `${padTime(hrs)}:${padTime(mins)}:${padTime(secs)}`;
}

const ListElem = ({ data }: any) => {
  return (
    <div className="p-2 flex gap-5 hover:bg-[#394150] rounded-[18px] overflow-hidden mb-2 cursor-pointer">
      <div className="h-16 aspect-video rounded-xl bg-[#ffffff1f] relative"></div>
      <div className="flex flex-col text-sm">
        <div className="text-white font-semibold overflow-hidden overflow-ellipsis grow">
          {data.text}
        </div>
        <div className="text-[#101824] flex justify-center items-center w-[max-content] rounded-md bg-[#9DA3AE] px-2">
          {msToTime(data.from)}
        </div>
      </div>
      {/*<div className="ml-auto shrink-0">
        <Image
          className="cursor-pointer"
          src="/forward.svg"
          alt=""
          width="28"
          height="28"
        />
        <Image
          className="cursor-pointer mt-[18px]"
          src="/loop.svg"
          alt=""
          width="28"
          height="28"
        />
      </div>*/}
    </div>
  );
};

export const responseSchema = z.object({
  videoUrl: z.string().url(),
  captionsVtt: z.string().min(1),
});

interface Props {
  videoUrl?: string;
}

const Content = ({ videoUrl }: Props) => {
  const { data } = useQuery({
    queryKey: [videoUrl],
    enabled: !!videoUrl,
    queryFn: async () => {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/mock-api/transcribe?videoUrl=${videoUrl}`,
      );
      const json = responseSchema.parse(await res.json());
      const { entries } = parse(json.captionsVtt);
      return { ...json, parsedCaptions: entries };
    },
  });

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

  const searchQuery = watch("searchQuery");

  const filteredCaptions = useMemo(
    () =>
      data?.parsedCaptions.filter((entry) =>
        entry.text.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [data?.parsedCaptions, searchQuery],
  );

  if (!data)
    return (
      <div className="m-auto flex align-center">
        <Image
          className="cursor-pointer mt-[18px] animate-spin"
          src="/loading.svg"
          alt=""
          width="77"
          height="77"
        />
      </div>
    );

  return (
    <div className="flex-1 grid grid-cols-3 gap-10 bg-[#212A36] rounded-3xl overflow-hidden p-10">
      <div className="col-span-2">
        <div className="bg-[#ffffff1f] rounded-2xl p-2">
          <video
            preload="auto"
            controls
            className="w-full max-h-fit rounded-xl overflow-hidden"
          >
            <source src={data.videoUrl} type="application/ogg" />
            <track
              label="English"
              kind="subtitles"
              srcLang="en"
              src={`data:text/vtt;charset=UTF-8,${encodeURIComponent(
                data.captionsVtt,
              )}`}
              default
            />
          </video>
        </div>
      </div>
      <div className="rounded-[32px] flex flex-col gap-5 overflow-hidden">
        <Search
          placeholder="Filter"
          name="searchQuery"
          register={register}
          errors={errors}
        />
        <div className="text-white text-base font-semibold">
          Results: {filteredCaptions?.length || 0}
        </div>
        <div className="overflow-y-auto">
          {filteredCaptions?.map((result: any) => {
            return <ListElem key={result.text} data={result} />;
          })}
        </div>
      </div>
    </div>
  );
};

export default Content;
