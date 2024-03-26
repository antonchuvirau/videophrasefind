"use server";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import { type SearchData } from "twelvelabs-js";

import { getS3DirectoryUrl } from "@/lib/s3";

import { type Entry } from "@plussub/srt-vtt-parser/dist/src/types";

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
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/trigger`, {
    method: "POST",
    body: JSON.stringify({ indexName, url }),
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-cache",
  });
  return res.json();
}

export async function fetchAndTrigger(url: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/fetch-and-trigger`,
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
  const { s3Directory } = await res.json();
  return { s3Directory };
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
