import { db } from "./db";

/** 管理面板的数据统计 */

export type AdminTotals = {
  users: number;
  games: number;
  resources: number;
  patches: number;
  comments: number;
};

export type AdminRecent = {
  newUsers: number;
  activeUsers: number;
  newGames: number;
  newResources: number;
  newComments: number;
};

export async function getAdminTotals(): Promise<AdminTotals> {
  const [users, games, resources, patches, comments] = await Promise.all([
    db.user.count(),
    db.game.count(),
    db.resource.count(),
    db.resource.count({ where: { type: "PATCH" } }),
    db.comment.count(),
  ]);

  return { users, games, resources, patches, comments };
}

/** 最近 N 天的增量；activeUsers 用「期间有评论或评分」近似 */
export async function getAdminRecent(days: number): Promise<AdminRecent> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [newUsers, newGames, newResources, newComments, commenters, raters] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.game.count({ where: { createdAt: { gte: since } } }),
    db.resource.count({ where: { createdAt: { gte: since } } }),
    db.comment.count({ where: { createdAt: { gte: since } } }),
    db.comment.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    db.rating.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const active = new Set([...commenters.map((row) => row.userId), ...raters.map((row) => row.userId)]);

  return {
    newUsers,
    activeUsers: active.size,
    newGames,
    newResources,
    newComments,
  };
}
