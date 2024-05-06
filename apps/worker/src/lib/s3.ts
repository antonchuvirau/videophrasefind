import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const S3_BASE =
  process.env.S3_BASE ||
  "https://videphrasefind.s3.eu-north-1.amazonaws.com/videos";

// https://videphrasefind.s3.eu-north-1.amazonaws.com/videos/clvqv8rb50000baqobltklw28/video.webm
// https://videphrasefind.s3.eu-north-1.amazonaws.com/videos/clvqv8rb50000baqobltklw28/video.cropped.webm

// https://videphrasefind.s3.eu-north-1.amazonaws.com/videos/clvqukcoa0004xb06epbjzg7w/video.webm
// https://videphrasefind.s3.eu-north-1.amazonaws.com/videos/clvqukcoa0004xb06epbjzg7w/video.cropped.webm

export function getS3DirectoryUrl(videoId: string) {
  return `${S3_BASE}/${videoId}`;
}

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

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function getCroppedUploadUrl(videoId: string) {
  const client = new S3Client({
    region: process.env.AWS_REGION || "eu-north-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET || "",
    Key: `videos/${videoId}/video.cropped.webm`,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}
