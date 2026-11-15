import { PrismaClient } from "@prisma/client";

/**
 * Prisma 单例。
 * next dev 的热更新会反复求值模块，不复用实例会耗尽数据库连接。
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
