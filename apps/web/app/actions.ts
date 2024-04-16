"use server";

import { z } from "zod";
import { type Entry } from "@plussub/srt-vtt-parser/dist/src/types";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import { type SearchData } from "twelvelabs-js";
import { auth } from "@clerk/nextjs";

import { db } from "database";

import { getS3DirectoryUrl } from "@/lib/s3";

import { client12Labs } from "@/twelveLabs/client";

export async function getVideoUrl(s3Directory: string) {
  const url = `${getS3DirectoryUrl(s3Directory)}/video.webm`;
  console.log(`Checking if video exists: ${url}`);
  const res = await fetch(url, { cache: "no-cache", method: "HEAD" });

  if (res.status !== 200) {
    return null;
  }

  return url;
}

export async function getUploadUrl() {
  const id = uuid();

  const client = new S3Client({
    region: process.env.AWS_REGION || "eu-north-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET || "",
    Key: `videos/${id}/video.webm`,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const downloadUrl = uploadUrl.replace(/\?.*/, "");
  return { uploadUrl, s3Directory: id, downloadUrl };
}

export async function trigger(url: string, indexName: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/downloader/trigger`,
    {
      method: "POST",
      body: JSON.stringify({ indexName, url }),
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    },
  );
  return res.json();
}

export async function fetchAndTrigger(url: string) {
  const schema = z.object({
    s3Directory: z.string(),
    videoTitle: z.string(),
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/downloader/fetch-and-trigger`,
    {
      method: "POST",
      body: JSON.stringify({ url }),
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    },
  );

  return schema.parse(await res.json());
}

export async function getSemanticSearchResult(
  indexName: string,
  query: string,
) {
  const [index] = await client12Labs.index.list({ name: indexName });

  const search = await client12Labs.search.query({
    indexId: index.id,
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

export async function saveVideo({
  videoTitle,
  indexName,
}: {
  videoTitle: string;
  indexName: string;
}) {
  const { userId } = await auth();

  const { id } = await db.video.create({
    data: {
      title: videoTitle,
      indexName,
      userId,
    },
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/video/save-metadata`,
    {
      method: "PATCH",
      body: JSON.stringify({ videoId: id, indexName }),
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    },
  );

  console.log(await res.json());

  return id;
}
