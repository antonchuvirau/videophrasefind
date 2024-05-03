const S3_BASE =
  process.env.S3_BASE ||
  "https://videphrasefind.s3.eu-north-1.amazonaws.com/videos";

export function getS3DirectoryUrl(videoId: string) {
  return `${S3_BASE}/${videoId}`;
}
