"use server";

import { z } from "zod";
import { type Entry } from "@plussub/srt-vtt-parser/dist/src/types";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type SearchData } from "twelvelabs-js";
import { db } from "database";

import { client12Labs } from "@/twelveLabs/client";

export async function getUploadUrl(videoId: string) {
  const client = new S3Client({
    region: process.env.AWS_REGION || "eu-north-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET || "",
    Key: `videos/${videoId}/video.webm`,
  });

  return await getSignedUrl(client, command, { expiresIn: 3600 }); // uploadUrl = getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function trigger(videoId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/downloader/trigger`,
    {
      method: "POST",
      body: JSON.stringify({ videoId }),
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    },
  );
  return z
    .object({
      message: z.string(),
    })
    .parse(await res.json());
}

export async function fetchAndTrigger(ytUrl: string, videoId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/downloader/fetch-and-trigger`,
    {
      method: "POST",
      body: JSON.stringify({ url: ytUrl, videoId }),
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    },
  );
  return z
    .object({
      message: z.string(),
    })
    .parse(await res.json());
}

export async function getSemanticSearchResult(videoId: string, query: string) {
  const video = await db.video.findUnique({
    where: {
      id: videoId,
    },
  });

  if (!video?.twelveLabsIndexId) return [];

  const search = await client12Labs.search.query({
    indexId: video.twelveLabsIndexId,
    query: query,
    options: ["conversation"],
    conversationOption: "semantic",
  });

  const result = (search.data as SearchData[]).map((clip) => ({
    entry: {
      id: "",
      from: clip.start * 1000,
      to: clip.end * 1000,
      text: clip.metadata?.[0].text,
    } as Entry,
    thumbnailSrc: clip.thumbnailUrl,
    confidence: clip.confidence,
  }));

  return result;
}
