"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { updateTag } from "next/cache";

/** 收藏 / 取消收藏条目（详情页上方的爱心） */
export async function toggleCollectAction(formData: FormData): Promise<void> {
  const me = await requireUser();

  const gameId = String(formData.get("gameId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!gameId || !slug) redirect("/");

  const existing = await db.collection.findUnique({
    where: { gameId_userId: { userId: me.id, gameId } },
    select: { userId: true },
  });

  if (existing) {
    await db.collection.delete({ where: { gameId_userId: { userId: me.id, gameId } } });
  } else {
    await db.collection.create({ data: { userId: me.id, gameId } });
  }

  updateTag("games");
  revalidatePath(`/galgame/${slug}`);
  revalidatePath("/user");
  redirect(`/galgame/${slug}`);
}
