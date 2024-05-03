"use server";

import { db } from "database";
import { auth } from "@clerk/nextjs/server";

import { getS3DirectoryUrl } from "@/lib/s3";

export async function getVideoUrl(videoId: string) {
  const url = `${getS3DirectoryUrl(videoId)}/video.webm`;
  console.log(`Checking if video exists: ${url}`);
  const res = await fetch(url, { cache: "no-cache", method: "HEAD" });

  if (res.status !== 200) {
    return null;
  }

  return url;
}

export async function getVideoProcessingStatus(videoId: string) {
  const data = await db.video.findUnique({
    where: { id: videoId },
    select: { status: true },
  });

  return data?.status;
}

export async function getVideo12LabsIds(videoId: string) {
  const data = await db.video.findUnique({
    where: { id: videoId },
    select: { twelveLabsVideoId: true, twelveLabsIndexId: true },
  });

  return { ...data };
}

export async function createVideo() {
  const { userId } = auth();

  const video = await db.video.create({
    data: {
      userId,
    },
  });

  const triggerSaveMetadataRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/video/trigger-save-metadata`,
    {
      method: "PATCH",
      body: JSON.stringify({ videoId: video.id }),
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    },
  );

  console.log(await triggerSaveMetadataRes.json());

  const triggerStatusUpdateRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/video/trigger-status-update`,
    {
      method: "PATCH",
      body: JSON.stringify({ videoId: video.id }),
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    },
  );

  console.log(await triggerStatusUpdateRes.json());

  return video.id;
}

export async function saveVideoTitle({
  videoTitle,
  videoId,
}: {
  videoTitle: string;
  videoId: string;
}) {
  const video = await db.video.update({
    where: { id: videoId },
    data: { title: videoTitle },
  });

  return video.title;
}
