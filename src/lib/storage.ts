import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { env, isS3Enabled } from "./env";

/**
 * 存储适配层（文章封面、正文插图）。
 *
 * 配齐 S3_* 就上传到对象存储并返回其公网地址；
 * 否则落到 public/uploads，由 Next 静态托管，本地开发零依赖。
 */

export interface StoredObject {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  filename: string;
}

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_MIME = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
]);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function extensionFor(mimeType: string): string | null {
  return ALLOWED_MIME.get(mimeType) ?? null;
}

/** 生成不会互相覆盖的对象键：uploads/2026/11/<rand>.<ext> */
export function buildObjectKey(extension: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const rand = randomBytes(8).toString("hex");
  return `uploads/${yyyy}/${mm}/${rand}.${extension}`;
}

function safeName(filename: string, extension: string): string {
  const base = path.basename(filename, path.extname(filename));
  const cleaned = base.replace(/[^\w\-.]+/g, "-").slice(0, 60) || "image";
  return `${cleaned}.${extension}`;
}

export async function putObject(
  key: string,
  body: Buffer,
  mimeType: string,
  filename: string,
): Promise<StoredObject> {
  if (isS3Enabled) {
    return putS3Object(key, body, mimeType, filename);
  }
  return putLocalObject(key, body, mimeType, filename);
}

async function putLocalObject(
  key: string,
  body: Buffer,
  mimeType: string,
  filename: string,
): Promise<StoredObject> {
  const target = path.join(LOCAL_UPLOAD_DIR, key.replace(/^uploads\//, ""));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);

  return {
    key,
    url: `/uploads/${key.replace(/^uploads\//, "")}`,
    size: body.byteLength,
    mimeType,
    filename: safeName(filename, path.extname(target).slice(1)),
  };
}

async function putS3Object(
  key: string,
  body: Buffer,
  mimeType: string,
  filename: string,
): Promise<StoredObject> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: env.s3.region,
    endpoint: env.s3.endpoint || undefined,
    forcePathStyle: Boolean(env.s3.endpoint),
    credentials: {
      accessKeyId: env.s3.accessKeyId,
      secretAccessKey: env.s3.secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const publicBase = env.s3.publicBaseUrl || `https://${env.s3.bucket}.s3.${env.s3.region}.amazonaws.com`;

  return {
    key,
    url: `${publicBase}/${key}`,
    size: body.byteLength,
    mimeType,
    filename: safeName(filename, path.extname(filename).slice(1) || "bin"),
  };
}

/** 删除对象。失败只记录日志，不阻断业务流程。 */
export async function deleteObject(key: string): Promise<void> {
  try {
    if (isS3Enabled) {
      const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const client = new S3Client({
        region: env.s3.region,
        endpoint: env.s3.endpoint || undefined,
        forcePathStyle: Boolean(env.s3.endpoint),
        credentials: {
          accessKeyId: env.s3.accessKeyId,
          secretAccessKey: env.s3.secretAccessKey,
        },
      });
      await client.send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key }));
      return;
    }

    await unlink(path.join(LOCAL_UPLOAD_DIR, key.replace(/^uploads\//, "")));
  } catch (error) {
    console.warn("[storage] 删除对象失败:", key, error);
  }
}
