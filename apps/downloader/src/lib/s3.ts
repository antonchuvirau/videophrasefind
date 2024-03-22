import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

export async function getUploadUrl(id?: string) {
  const videoId = id ? id : uuid();

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

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const downloadUrl = uploadUrl.replace(/\?.*/, "");

  return { uploadUrl, s3Directory: videoId, downloadUrl };
}
