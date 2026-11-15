// 清空演示内容（保留账号、会社、标签、站点设置）
//
// 用法：
//   npm run db:reset-content          # 只统计，不动数据
//   npm run db:reset-content -- --yes # 真正删除
//
// 删除范围：游戏条目（级联资源/评论/评分/收藏）→ 独立资源 → 文档
// 不删除：User（含角色与积分）、Company、Tag、SiteSetting、Doc 之外的管理配置。
//
// 为什么单独做一个脚本：prisma/seed.mjs 会按固定 ID 重建演示数据，
// 直接重跑种子会把删掉的条目又补回来，容易误操作。

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const confirmed = process.argv.includes("--yes");

const [games, resources, docs, comments, ratings] = await Promise.all([
  prisma.game.count(),
  prisma.resource.count(),
  prisma.doc.count(),
  prisma.comment.count(),
  prisma.rating.count(),
]);

console.log("当前内容：");
console.log(`  条目 ${games} / 资源 ${resources} / 文档 ${docs} / 评论 ${comments} / 评分 ${ratings}`);

if (!confirmed) {
  console.log("\n这是预演，没有删除任何数据。");
  console.log("确认清空请运行：npm run db:reset-content -- --yes");
  await prisma.$disconnect();
  process.exit(0);
}

// 顺序很重要：先删依赖条目的表，再删条目本身
await prisma.$transaction([
  prisma.gameTag.deleteMany(),
  prisma.rating.deleteMany(),
  prisma.comment.deleteMany(),
  prisma.collection.deleteMany(),
  prisma.resource.deleteMany(),
  prisma.game.deleteMany(),
  prisma.doc.deleteMany(),
]);

console.log("\n✓ 已清空演示内容（账号、会社、标签、站点设置保留）");
console.log("  现在可以在后台发布你自己的条目了。");
await prisma.$disconnect();
