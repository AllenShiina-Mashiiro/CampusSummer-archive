"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/admin-guard";
import { db } from "@/lib/db";

/**
 * 资源点赞 / 取消点赞。
 *
 * ResourceLike 表用原生 SQL 建（Prisma migrate 在这台机器上起不了引擎），
 * 因此这里也用 raw 查询，计数同步写回 Resource.likeCount。
 */
export async function toggleResourceLikeAction(formData: FormData): Promise<void> {
  const me = await requireUser();

  const resourceId = String(formData.get("resourceId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!resourceId || !slug) redirect("/");

  const existing = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "ResourceLike" WHERE "resourceId" = ${resourceId} AND "userId" = ${me.id} LIMIT 1
  `;

  if (existing.length > 0) {
    await db.$executeRaw`DELETE FROM "ResourceLike" WHERE id = ${existing[0].id}`;
    await db.$executeRaw`
      UPDATE "Resource" SET "likeCount" = GREATEST("likeCount" - 1, 0) WHERE id = ${resourceId}
    `;
  } else {
    await db.$executeRaw`
      INSERT INTO "ResourceLike" (id, "resourceId", "userId") VALUES (${randomUUID()}, ${resourceId}, ${me.id})
    `;
    await db.$executeRaw`
      UPDATE "Resource" SET "likeCount" = "likeCount" + 1 WHERE id = ${resourceId}
    `;
  }

  revalidatePath(`/galgame/${slug}`);
  redirect(`/galgame/${slug}?tab=resources`);
}

/** 当前用户点过赞的资源 id 集合 */
export async function likedResourceIds(userId: string): Promise<Set<string>> {
  const rows = await db.$queryRaw<{ resourceId: string }[]>`
    SELECT "resourceId" FROM "ResourceLike" WHERE "userId" = ${userId}
  `;
  return new Set(rows.map((row) => row.resourceId));
}
