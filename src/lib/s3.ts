import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

export const s3Client =
  endpoint && accessKeyId && secretAccessKey
    ? new S3Client({
        endpoint,
        region: process.env.S3_REGION || "auto",
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: { accessKeyId, secretAccessKey },
      })
    : null;

export const s3Bucket = process.env.S3_BUCKET || "";
export const s3PublicUrl = process.env.S3_PUBLIC_URL?.replace(/\/$/, "") || "";

export function getPublicObjectUrl(key: string) {
  if (!s3PublicUrl || !key) return null;
  return `${s3PublicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
