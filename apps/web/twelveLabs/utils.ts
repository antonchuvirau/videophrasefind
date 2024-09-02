import { z } from "zod";
import { parse } from "@plussub/srt-vtt-parser";
import { intervalToDuration } from "date-fns";
import _ from "lodash";

function padTime(time?: number) {
  return _.padStart(time?.toFixed(0), 2, "0");
}

function secondsToVttFormat(seconds: number) {
  const duration = intervalToDuration({
    start: 0,
    end: seconds * 1000,
  });

  const milliseconds = (seconds - Math.floor(seconds)) * 1000;
  return `${padTime(duration?.minutes)}:${padTime(
    duration?.seconds,
  )}.${_.padEnd(milliseconds.toFixed(0), 3, "0")}`;
}

export const transcriptionsSchema = z
  .object({
    value: z.string(),
    start: z.number(),
    end: z.number(),
  })
  .array()
  // This transform assumes 12labs sends transcriptions word-by-word
  .transform((transactiptions) => {
    return _.chunk(transactiptions, 5).map((chunk) => ({
      start: _.first(chunk)!.start,
      end: _.last(chunk)!.end,
      value: chunk.map((transcription) => transcription.value).join(" "),
    }));
  })
  .transform((transcriptions) => {
    const vttLines = transcriptions.map(
      (transcription) =>
        `${secondsToVttFormat(transcription.start)} --> ${secondsToVttFormat(
          transcription.end,
        )}\n- ${transcription.value}\n`,
    );

    return {
      captionsVtt: `WEBVTT\n${vttLines.join("\n")}`,
    };
  })
  .transform((data) => ({
    ...data,
    parsedCaptions: parse(data.captionsVtt).entries,
  }));

export type TranscriptionsSchema = z.infer<typeof transcriptionsSchema>;
