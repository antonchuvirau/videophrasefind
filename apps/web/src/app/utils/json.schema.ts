import { intervalToDuration } from "date-fns";
import _ from "lodash";
import { parse } from "@plussub/srt-vtt-parser";
import { z } from "zod";

function padTime(time?: number) {
  return _.padStart(time?.toFixed(0), 2, "0");
}

export function secondsToVttFormat(seconds: number) {
  const duration = intervalToDuration({
    start: 0,
    end: seconds * 1000,
  });

  const milliseconds = (seconds - Math.floor(seconds)) * 1000;
  return `${padTime(duration?.minutes)}:${padTime(
    duration?.seconds,
  )}.${_.padEnd(milliseconds.toFixed(0), 3, "0")}`;
}

export const jsonSchema = z
  .object({
    transcription_array: z.string().array(),
    timestamp_array: z.tuple([z.number(), z.number()]).array(),
  })
  .transform((data) => {
    // Split our words and timestamps into chunks
    const CHUNK_SIZE = 6;
    const timestamps = _.chunk(data.timestamp_array, CHUNK_SIZE).map(
      // Take the beginning and the end of each chunk
      (intervals) =>
        [intervals[0][0], intervals[intervals.length - 1][1]] as const,
    );
    const texts = _.chunk(data.transcription_array, CHUNK_SIZE);

    const vttLines = timestamps.map((timestamp, index) => {
      const text = texts[index];
      return `${secondsToVttFormat(timestamp[0])} --> ${secondsToVttFormat(
        timestamp[1],
      )}\n- ${text.join(" ")}\n`;
    });

    return {
      captionsVtt: `WEBVTT\n${vttLines.join("\n")}`,
    };
  })
  .transform((data) => ({
    ...data,
    parsedCaptions: parse(data.captionsVtt).entries,
  }));

export type JsonSchema = z.infer<typeof jsonSchema>;
