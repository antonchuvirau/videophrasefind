import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const S3_BASE =
  process.env.S3_BASE ||
  "https://videphrasefind.s3.eu-north-1.amazonaws.com/videos";

export function getS3DirectoryUrl(videoId: string) {
  return `${S3_BASE}/${videoId}`;
}

export async function getUploadUrl(
  videoId: string,
  videoSize: "full" | "cropped"
) {
  const client = new S3Client({
    region: process.env.AWS_REGION || "eu-north-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET || "",
    Key:
      videoSize === "full"
        ? `videos/${videoId}/video.webm`
        : `videos/${videoId}/video.cropped.webm`,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}
