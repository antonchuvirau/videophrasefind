import { z } from "zod";
import { parse } from "@plussub/srt-vtt-parser";

import { secondsToVttFormat } from "../utils/json.schema";

export const transcriptionsSchema = z
  .object({
    value: z.string(),
    start: z.number(),
    end: z.number(),
  })
  .array()
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
