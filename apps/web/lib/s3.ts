const S3_BASE =
  process.env.S3_BASE ||
  "https://videphrasefind.s3.eu-north-1.amazonaws.com/videos";

export function getS3DirectoryUrl(s3Path: string) {
  return `${S3_BASE}/${encodeURIComponent(s3Path)}`;
}
