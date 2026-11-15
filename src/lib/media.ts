import { createHash, randomUUID } from "node:crypto";

import { db } from "./db";
import { buildObjectKey, deleteObject, extensionFor, putObject } from "./storage";

/**
 * 媒体库：按内容哈希去重 + 引用扫描清理孤儿文件。
 *
 * 用原生 SQL 访问 Media 表：当前环境的 prisma generate 被锁住的引擎 DLL 挡住，
 * 表已建好，raw 查询不受影响；等 generate 恢复后可切回类型化写法。
 */

export type MediaRow = {
  id: string;
  hash: string;
  key: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  createdat: Date;
};

export type StoredUpload = {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  filename: string;
  /** true 表示命中已有文件，没有重复存储 */
  deduped: boolean;
};

/** 上传并存档；内容相同的文件直接复用 */
export async function storeUpload(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  uploadedById?: string,
): Promise<StoredUpload> {
  const hash = createHash("sha256").update(buffer).digest("hex");

  const existing = await db.$queryRaw<MediaRow[]>`
    SELECT id, hash, key, url, filename, "mimeType" AS mimetype, size, "createdAt" AS createdat
    FROM "Media" WHERE hash = ${hash} LIMIT 1
  `;

  if (existing.length > 0) {
    const row = existing[0];
    return {
      url: row.url,
      key: row.key,
      size: row.size,
      mimeType: row.mimetype,
      filename: row.filename,
      deduped: true,
    };
  }

  const extension = extensionFor(mimeType) ?? "bin";
  const stored = await putObject(buildObjectKey(extension), buffer, mimeType, filename);

  await db.$executeRaw`
    INSERT INTO "Media" ("id", "hash", "key", "url", "filename", "mimeType", "size", "uploadedById", "createdAt")
    VALUES (${randomUUID()}, ${hash}, ${stored.key}, ${stored.url}, ${stored.filename}, ${mimeType}, ${stored.size}, ${uploadedById ?? null}, NOW())
  `;

  return {
    url: stored.url,
    key: stored.key,
    size: stored.size,
    mimeType,
    filename: stored.filename,
    deduped: false,
  };
}

/** 收集全站被引用的图片地址 */
export async function collectReferencedUrls(): Promise<Set<string>> {
  const urls = new Set<string>();

  const games = await db.game.findMany({ select: { coverUrl: true, screenshots: true } });
  for (const game of games) {
    if (game.coverUrl) urls.add(game.coverUrl);
    for (const shot of game.screenshots) urls.add(shot);
  }

  const docs = await db.doc.findMany({ select: { coverUrl: true, content: true } });
  for (const doc of docs) {
    if (doc.coverUrl) urls.add(doc.coverUrl);
    // 正文里的 Markdown 图片：把 /uploads/... 抽出来
    for (const match of doc.content.matchAll(/\/uploads\/[^\s)"']+/g)) {
      urls.add(match[0]);
    }
  }

  const users = await db.user.findMany({ select: { avatarUrl: true } });
  for (const user of users) {
    if (user.avatarUrl) urls.add(user.avatarUrl);
  }

  const settings = await db.siteSetting.findMany();
  for (const row of settings) {
    if (row.value.startsWith("/uploads/") || row.value.startsWith("http")) urls.add(row.value);
  }

  return urls;
}

export type MediaStats = {
  total: number;
  bytes: number;
  orphans: number;
};

/** 统计 + 列出未被引用的文件 */
export async function scanMedia(): Promise<{ stats: MediaStats; orphans: MediaRow[]; rows: MediaRow[] }> {
  const referenced = await collectReferencedUrls();

  const rows = await db.$queryRaw<MediaRow[]>`
    SELECT id, hash, key, url, filename, "mimeType" AS mimetype, size, "createdAt" AS createdat
    FROM "Media" ORDER BY "createdAt" DESC
  `;

  const orphans = rows.filter((row) => !referenced.has(row.url));

  return {
    stats: {
      total: rows.length,
      bytes: rows.reduce((sum, row) => sum + row.size, 0),
      orphans: orphans.length,
    },
    orphans,
    rows,
  };
}

/** 删除所有孤儿文件（数据库记录 + 实际文件） */
export async function cleanupOrphans(): Promise<number> {
  const { orphans } = await scanMedia();

  for (const row of orphans) {
    await deleteObject(row.key);
    await db.$executeRaw`DELETE FROM "Media" WHERE id = ${row.id}`;
  }

  return orphans.length;
}
