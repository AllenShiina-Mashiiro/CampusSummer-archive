// 创建（或重置）站点管理员 / 超级管理员
//
// 用法：
//   ADMIN_EMAIL=you@example.com ADMIN_USERNAME=you ADMIN_PASSWORD='...' npm run db:create-admin
//   默认创建 SUPER_ADMIN；加 --role=ADMIN 可创建普通管理员
//   已存在同名账号时加 --force 重置密码并修正角色
//
// 设计要点：
// - 密码只从环境变量读，不落进代码库；
// - 管理员密码要求比普通注册更严（≥10 位且同时含字母与数字）；
// - 已存在同名账号时默认报错退出，避免误覆盖；
// - 只有这个脚本能产生 SUPER_ADMIN，注册页永远只创建 USER。

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const ROLES = ["USER", "CREATOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"];

const username = (process.env.ADMIN_USERNAME ?? "").trim();
const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const displayName = (process.env.ADMIN_DISPLAY_NAME ?? username).trim();
const force = process.argv.includes("--force");

const USERNAME_MAX = 17;
const NICKNAME_MAX = 24;

const roleArg = process.argv.find((arg) => arg.startsWith("--role="));
const role = roleArg ? roleArg.split("=")[1].toUpperCase() : "SUPER_ADMIN";

if (!username) fail("缺少 ADMIN_USERNAME");
if (username.length > USERNAME_MAX) fail(`ADMIN_USERNAME 最长 ${USERNAME_MAX} 个字符`);
if (!/^[A-Za-z0-9_]+$/.test(username)) fail("ADMIN_USERNAME 只能包含字母、数字和下划线");
if (!displayName) fail("ADMIN_DISPLAY_NAME 不能为空");
if (displayName.length > NICKNAME_MAX) fail(`ADMIN_DISPLAY_NAME 最长 ${NICKNAME_MAX} 个字符`);
if (!email || !email.includes("@")) fail("缺少或非法的 ADMIN_EMAIL");
if (password.length < 10) fail("ADMIN_PASSWORD 至少 10 位");
if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
  fail("ADMIN_PASSWORD 需同时包含字母和数字");
}
if (!ROLES.includes(role)) fail(`--role 只能是 ${ROLES.join(" / ")}`);

const existing = await prisma.user.findFirst({
  where: { OR: [{ username }, { email }] },
  select: { id: true, username: true, email: true, role: true },
});

if (existing && !force) {
  fail(
    `账号已存在（${existing.username} / ${existing.email}，角色 ${existing.role}）。` +
      `如果是要重置密码或修正角色，请追加 --force`,
  );
}

const passwordHash = await bcrypt.hash(password, 10);

if (existing) {
  await prisma.user.update({
    where: { id: existing.id },
    data: { passwordHash, role, displayName, email },
  });
  console.log(`✓ 已重置 ${role}：${existing.username}（${existing.email}）`);
} else {
  const created = await prisma.user.create({
    data: { username, email, displayName, passwordHash, role },
    select: { username: true, email: true },
  });
  console.log(`✓ 已创建 ${role}：${created.username}（${created.email}）`);
}

// 管理员邮箱同时写入站点设置，后台「管理员邮箱」和登录邮箱保持绑定
await prisma.siteSetting.upsert({
  where: { key: "adminEmail" },
  create: { key: "adminEmail", value: email },
  update: { value: email },
});

console.log("  现在可以用该账号登录，并访问 /admin。");
console.log("  SUPER_ADMIN 额外拥有：角色升降、网站设置、文档发布、管理日志、邮件群发。");
await prisma.$disconnect();
