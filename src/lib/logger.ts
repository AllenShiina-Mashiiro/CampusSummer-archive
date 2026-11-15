import { randomUUID } from "node:crypto";

import { db } from "./db";

type Level = "INFO" | "WARN" | "ERROR";

/**
 * 写一条管理日志。
 *
 * 用原生 SQL 而不是 `db.adminLog`：当前环境的 Prisma 客户端生成被锁住的 DLL 挡住，
 * 而表已在数据库里，走 raw 查询不受影响。等 `prisma generate` 能跑通后可切回类型化写法。
 * 日志失败不能影响业务，所以整体 try/catch 吞掉异常。
 */
export async function writeLog(level: Level, source: string, message: string): Promise<void> {
  try {
    await db.$executeRaw`
      INSERT INTO "AdminLog" ("id", "level", "source", "message", "createdAt")
      VALUES (${randomUUID()}, ${level}, ${source}, ${message.slice(0, 500)}, NOW())
    `;
  } catch (error) {
    console.warn("[log] 写入失败", source, message, error);
  }
}

export type LogRow = {
  id: string;
  level: string;
  source: string;
  message: string;
  createdAt: Date;
};

export async function listLogs(limit = 100): Promise<LogRow[]> {
  try {
    return await db.$queryRaw<LogRow[]>`
      SELECT id, level, source, message, "createdAt"
      FROM "AdminLog"
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
  } catch (error) {
    console.warn("[log] 读取失败", error);
    return [];
  }
}
