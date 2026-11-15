"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

/** 发表讨论 */
export async function addCommentAction(formData: FormData): Promise<void> {
  const me = await requireUser();

  const gameId = String(formData.get("gameId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!gameId || !slug) redirect("/galgame");
  if (!content) redirect(`/galgame/${encodeURIComponent(slug)}?tab=comments&error=empty`);

  const user = await db.user.findUnique({ where: { id: me.id }, select: { bannedUntil: true } });
  if (user?.bannedUntil && user.bannedUntil.getTime() > Date.now()) {
    redirect(`/galgame/${encodeURIComponent(slug)}?tab=comments&error=banned`);
  }

  await db.comment.create({ data: { gameId, userId: me.id, content: content.slice(0, 1000) } });

  // 解析 @用户名 并通知对方
  const mentions = [...content.matchAll(/@([\w-]{2,20})/g)].map((match) => match[1]);
  const unique = [...new Set(mentions)].slice(0, 5);

  if (unique.length > 0) {
    const targets = await db.user.findMany({
      where: { username: { in: unique }, id: { not: me.id } },
      select: { id: true },
    });

    for (const target of targets) {
      await notify({
        userId: target.id,
        type: "MENTION",
        title: `${me.displayName} 在讨论中提到了你`,
        body: content.slice(0, 80),
        href: `/galgame/${encodeURIComponent(slug)}?tab=comments`,
        actorId: me.id,
      });
    }
  }

  updateTag("games");
  updateTag(`game-${slug}`);
  redirect(`/galgame/${encodeURIComponent(slug)}?tab=comments`);
}

/** 给游戏打分（同一用户只保留最新一次） */
export async function addRatingAction(formData: FormData): Promise<void> {
  const me = await requireUser();

  const gameId = String(formData.get("gameId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const score = Number(formData.get("score") ?? 0);

  if (!gameId || !slug) redirect("/galgame");
  if (!Number.isFinite(score) || score < 1 || score > 10) {
    redirect(`/galgame/${encodeURIComponent(slug)}?tab=ratings&error=score`);
  }

  await db.rating.upsert({
    where: { gameId_userId: { gameId, userId: me.id } },
    create: { gameId, userId: me.id, score },
    update: { score },
  });

  // 重新计算均分
  const aggregate = await db.rating.aggregate({
    where: { gameId },
    _avg: { score: true },
    _count: { _all: true },
  });

  await db.game.update({
    where: { id: gameId },
    data: {
      rating: Number((aggregate._avg.score ?? 0).toFixed(1)),
      ratingCount: aggregate._count._all,
    },
  });

  updateTag("games");
  updateTag(`game-${slug}`);
  redirect(`/galgame/${encodeURIComponent(slug)}?tab=ratings`);
}
