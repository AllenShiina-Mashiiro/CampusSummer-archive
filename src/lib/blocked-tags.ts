import { cache } from "react";

import { getSession } from "./auth";
import { db } from "./db";

/**
 * 当前会话屏蔽的标签 slug。
 *
 * 必须在 `use cache` 函数之外调用（它读 cookie），
 * 再把结果作为参数传进查询层——这样缓存键里就带上了屏蔽集合。
 */
export const getBlockedTagSlugs = cache(async (): Promise<string[]> => {
  const session = await getSession();
  if (!session) return [];

  const rows = await db.blockedTag.findMany({
    where: { userId: session.id },
    select: { tag: { select: { slug: true } } },
  });

  return rows.map((row) => row.tag.slug);
});

/** 当前用户主动屏蔽的条目 id */
export const getBlockedGameIds = cache(async (): Promise<string[]> => {
  const session = await getSession();
  if (!session) return [];

  const rows = await db.$queryRaw<{ gameId: string }[]>`
    SELECT "gameId" FROM "BlockedGame" WHERE "userId" = ${session.id}
  `;

  return rows.map((row) => row.gameId);
});
