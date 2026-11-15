import { randomUUID } from "node:crypto";

import { db } from "./db";

/**
 * 通知服务。
 *
 * 表用原生 SQL 建（本机 Prisma 引擎起不了），读写同样走 raw 查询。
 * 通知失败不能影响主流程，所有写入都吞异常。
 */

export type NotifyType = "SYSTEM" | "ANNOUNCE" | "DOC" | "FOLLOW" | "MENTION" | "PRIVATE";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: Date;
  actorName: string | null;
  actorAvatar: string | null;
  actorUsername: string | null;
};

/** 给单个用户发通知 */
export async function notify(input: {
  userId: string;
  type: NotifyType;
  title: string;
  body?: string;
  href?: string | null;
  actorId?: string | null;
}): Promise<void> {
  try {
    await db.$executeRaw`
      INSERT INTO "Notification" ("id","userId","type","title","body","href","actorId","createdAt")
      VALUES (${randomUUID()}, ${input.userId}, ${input.type}, ${input.title},
              ${input.body ?? ""}, ${input.href ?? null}, ${input.actorId ?? null}, NOW())
    `;
  } catch (error) {
    console.warn("[notify] 写入失败", input.type, error);
  }
}

/** 给全体用户发通知（可排除操作者） */
export async function notifyAll(input: {
  type: NotifyType;
  title: string;
  body?: string;
  href?: string | null;
  actorId?: string | null;
  excludeUserId?: string | null;
}): Promise<number> {
  try {
    const users = await db.$queryRaw<{ id: string }[]>`SELECT id FROM "User"`;

    let sent = 0;
    for (const user of users) {
      if (input.excludeUserId && user.id === input.excludeUserId) continue;
      await notify({
        userId: user.id,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        actorId: input.actorId,
      });
      sent += 1;
    }

    return sent;
  } catch (error) {
    console.warn("[notify] 群发失败", input.type, error);
    return 0;
  }
}

/** 未读数 */
export async function unreadCount(userId: string): Promise<number> {
  try {
    const rows = await db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "Notification" WHERE "userId" = ${userId} AND read = false
    `;
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

/** 通知列表 */
export async function listNotifications(userId: string, take = 50): Promise<NotificationRow[]> {
  try {
    return await db.$queryRaw<NotificationRow[]>`
      SELECT n.id, n.type, n.title, n.body, n.href, n.read, n."createdAt",
             a."displayName" AS "actorName", a."avatarUrl" AS "actorAvatar", a.username AS "actorUsername"
      FROM "Notification" n
      LEFT JOIN "User" a ON a.id = n."actorId"
      WHERE n."userId" = ${userId}
      ORDER BY n."createdAt" DESC
      LIMIT ${take}
    `;
  } catch {
    return [];
  }
}

/** 全部标为已读 */
export async function markAllRead(userId: string): Promise<void> {
  try {
    await db.$executeRaw`UPDATE "Notification" SET read = true WHERE "userId" = ${userId} AND read = false`;
  } catch (error) {
    console.warn("[notify] 标记已读失败", error);
  }
}
