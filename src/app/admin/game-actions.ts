"use server";

import { updateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin, requireCapability, requireUser } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { writeLog } from "@/lib/logger";
import { can, USER_ROLES, type UserRole } from "@/lib/permissions";
import { slugify } from "@/lib/site";

/** 绠＄悊闈㈡澘涓庡垱浣滀腑蹇冪殑鍏辩敤鍐欐搷浣?*/

/**
 * 创作者与管理员都能发布游戏。
 */
async function requireGameEditor(gameId?: string) {
  const actor = await requireUser();

  if (!can(actor.role, "game.publish")) {
    redirect(can(actor.role, "admin.access") ? "/admin" : "/");
  }

  // 创作者之间协作维护：任何创作者都可以编辑任意条目，不再限制「只能改自己发布的」
  // （只有下载/补丁资源与正文一样共享编辑权，删除条目仍走管理员权限）

  return actor;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function values(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 平台 / 语言也要有自己的标签记录，否则详情页胶囊点进去是空页 */
async function ensureFacetTags(values: string[], kind: "PLATFORM" | "LANGUAGE") {
  const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))];

  for (const name of unique) {
    let slug = slugify(name);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const clash = await db.tag.findUnique({ where: { slug }, select: { id: true } });
      if (!clash) break;
      slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    }

    await db.tag.upsert({
      where: { name },
      create: { name, slug, kind },
      update: {},
    });
  }
}

/** 把标签名映射成 connectOrCreate；同名标签复用 */
async function tagWrites(names: string[]) {
  const unique = [...new Set(names)];
  return Promise.all(
    unique.map(async (name) => {
      const existing = await db.tag.findUnique({ where: { name }, select: { id: true } });
      if (existing) return { tag: { connect: { id: existing.id } } };

      let slug = slugify(name);
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const clash = await db.tag.findUnique({ where: { slug }, select: { id: true } });
        if (!clash) break;
        slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
      }

      return { tag: { connectOrCreate: { where: { name }, create: { name, slug, kind: "GENRE" as const } } } };
    }),
  );
}

export async function saveGameAction(formData: FormData): Promise<void> {
  const actor = await requireGameEditor(text(formData, "id") || undefined);

  const id = text(formData, "id");
  const title = text(formData, "title");
  if (!title) redirect(id ? `/admin/games/${id}?error=title` : "/admin/games/new?error=title");

  const tagNames = text(formData, "tags")
    .split(/[,，、\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);

  const platformList = values(formData, "platforms");
  const languageList = values(formData, "languages");
  const screenshots = values(formData, "screenshots").slice(0, 3);

  // 平台 / 语言随条目创建自动生成标签，保证详情页胶囊可点开
  await ensureFacetTags(platformList, "PLATFORM");
  await ensureFacetTags(languageList, "LANGUAGE");

  // 会社以「名称」输入：留空即未指定；不存在则自动创建
  // 先按 name 查（name 有唯一约束），再兜底建 slug，避免 slug 与 name 不一致时撞约束
  const companyName = text(formData, "companyName").trim();
  let companyId: string | null = null;
  if (companyName) {
    const existingCompany = await db.company.findUnique({
      where: { name: companyName },
      select: { id: true },
    });

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      let companySlug = slugify(companyName) || `company-${companyName.length}`;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const clash = await db.company.findUnique({ where: { slug: companySlug }, select: { id: true } });
        if (!clash) break;
        companySlug = `${companySlug}-${attempt + 2}`;
      }

      const created = await db.company.create({
        data: { name: companyName, slug: companySlug },
        select: { id: true },
      });
      companyId = created.id;
    }
  }

  const releaseDate = parseDate(text(formData, "releaseDate"));

  const data = {
    title,
    originalTitle: text(formData, "originalTitle") || null,
    romanizedTitle: text(formData, "romanizedTitle") || null,
    summary: text(formData, "summary"),
    coverUrl: text(formData, "coverUrl") || null,
    ...(formData.has("screenshots") ? { screenshots } : {}),
    platforms: platformList,
    languages: languageList,
    isSfw: formData.get("isSfw") === "on",
    companyId,
    releaseDate,
    resourceUpdatedAt: new Date(),
  };

  try {
    if (id) {
      const existing = await db.game.findUnique({ where: { id }, select: { slug: true } });
      if (!existing) redirect("/admin/games?error=missing");

      const slug = text(formData, "slug") || existing.slug;
      await db.game.update({
        where: { id },
        data: {
          ...data,
          slug,
          tags: { deleteMany: {}, create: await tagWrites(tagNames) },
        },
      });
    } else {
      const slugBase = text(formData, "slug") || slugify(title);
      let slug = slugBase;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const clash = await db.game.findUnique({ where: { slug }, select: { id: true } });
        if (!clash) break;
        slug = `${slugBase}-${Math.random().toString(36).slice(2, 5)}`;
      }

      await db.game.create({
        data: {
          ...data,
          slug,
          creatorId: actor.id,
          rating: 0,
          ratingCount: 0,
          viewCount: 0,
          downloadCount: 0,
          favoriteCount: 0,
          tags: { create: await tagWrites(tagNames) },
        },
      });
    }
  } catch (error) {
    console.error("[admin] 淇濆瓨鏉＄洰澶辫触", error);
    redirect(id ? `/admin/games/${id}?error=save` : "/admin/games/new?error=save");
  }

  updateTag("games");
  updateTag("tags");
  revalidatePath("/admin/games");
  revalidatePath("/creator");
  // 创作者没有后台权限，保存后回到创作中心
  redirect(can(actor.role, "admin.access") ? "/admin/games" : "/creator");
}

export async function deleteGameAction(formData: FormData): Promise<void> {
  const actor = await requireGameEditor(text(formData, "id") || undefined);
  const id = text(formData, "id");
  if (!id) return;

  await db.game.delete({ where: { id } });
  updateTag("games");
  updateTag("tags");
  revalidatePath("/admin/games");
  revalidatePath("/creator");
  redirect(can(actor.role, "admin.access") ? "/admin/games" : "/creator");
}

export async function saveResourceAction(formData: FormData): Promise<void> {
  // 创作者及以上都可以给任意条目补资源（协作维护）
  const actor = await requireCapability("resource.manage");

  const gameId = text(formData, "gameId");
  const title = text(formData, "resourceTitle");
  const url = text(formData, "resourceUrl");
  const back = text(formData, "back").startsWith("/creator") ? "/creator" : "/admin";
  const resourceId = text(formData, "resourceId");

  if (!gameId || !title || !url) redirect(`${back}/games/${gameId}?error=resource`);

  // 来源由操作者身份决定，不信任表单：管理员及以上算官方，创作者算社区
  const official = can(actor.role, "content.moderate");

  const payload = {
    title,
    url,
    type: (text(formData, "resourceType") || "GAME") as "GAME" | "PATCH" | "CG" | "OTHER",
    provider: (official ? "OFFICIAL" : "COMMUNITY") as "OFFICIAL" | "COMMUNITY",
    format: text(formData, "resourceFormat") || null,
    size: text(formData, "resourceSize") || null,
    netdisk: text(formData, "resourceNetdisk") || null,
    extractCode: text(formData, "resourceExtractCode") || null,
    note: text(formData, "resourceNote") || null,
  };

  if (resourceId) {
    // 编辑已有资源，不改变添加者
    await db.resource.update({ where: { id: resourceId }, data: payload });
  } else {
    await db.resource.create({ data: { ...payload, gameId, authorId: actor.id } });
  }

  await writeLog(
    "INFO",
    resourceId ? "resource.edit" : "resource.add",
    `@${actor.displayName} ${resourceId ? "更新" : "添加"}条目 ${gameId} 的资源「${title}」（${official ? "官方" : "社区"}）`,
  );

  updateTag("games");
  revalidatePath(`/admin/games/${gameId}`);
  revalidatePath(`/creator/games/${gameId}`);
  redirect(`${back}/games/${gameId}`);
}

export async function deleteResourceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData, "resourceId");
  const gameId = text(formData, "gameId");
  if (!id) return;

  await db.resource.delete({ where: { id } });
  updateTag("games");
  revalidatePath(`/admin/games/${gameId}`);
  redirect(`/admin/games/${gameId}`);
}

/** 评论批量删除 */
export async function deleteCommentsAction(formData: FormData): Promise<void> {
  await requireCapability("content.moderate");

  const ids = formData.getAll("ids").map((value) => String(value)).filter(Boolean);
  if (ids.length === 0) redirect("/admin/comments");

  await db.comment.deleteMany({ where: { id: { in: ids } } });
  updateTag("games");
  revalidatePath("/admin/comments");
  redirect(`/admin/comments?deleted=${ids.length}`);
}

/** 游戏批量删除：先清关联（评分/评论/资源/标签/收藏），再删条目 */
export async function deleteGamesAction(formData: FormData): Promise<void> {
  await requireCapability("content.moderate");

  const ids = formData.getAll("ids").map((value) => String(value)).filter(Boolean);
  if (ids.length === 0) redirect("/admin/games");

  await db.$transaction([
    db.gameTag.deleteMany({ where: { gameId: { in: ids } } }),
    db.rating.deleteMany({ where: { gameId: { in: ids } } }),
    db.comment.deleteMany({ where: { gameId: { in: ids } } }),
    db.resource.deleteMany({ where: { gameId: { in: ids } } }),
    db.collection.deleteMany({ where: { gameId: { in: ids } } }),
    db.game.deleteMany({ where: { id: { in: ids } } }),
  ]);

  updateTag("games");
  revalidatePath("/admin/games");
  redirect(`/admin/games?deleted=${ids.length}`);
}

/** 资源批量删除（下载资源 / 补丁资源共用） */
export async function deleteResourcesAction(formData: FormData): Promise<void> {
  await requireCapability("resource.manage");

  const ids = formData.getAll("ids").map((value) => String(value)).filter(Boolean);
  const back = String(formData.get("back") ?? "/admin/resources");
  const target = back === "/admin/patches" ? "/admin/patches" : "/admin/resources";

  if (ids.length === 0) redirect(target);

  await db.resource.deleteMany({ where: { id: { in: ids } } });
  updateTag("games");
  revalidatePath("/admin/resources");
  revalidatePath("/admin/patches");

  redirect(`${target}?deleted=${ids.length}`);
}

/** 手动封禁 / 解封（超级管理员与管理员） */
export async function banUserAction(formData: FormData): Promise<void> {
  const actor = await requireCapability("user.moderate");

  const userId = String(formData.get("userId") ?? "");
  const days = Number(formData.get("days") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!userId) redirect("/admin/users");
  if (userId === actor.id) redirect("/admin/users?error=self");

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { username: true, role: true },
  });
  if (!target) redirect("/admin/users?error=missing");

  // 超级管理员不可被封禁
  if (target.role === "SUPER_ADMIN") redirect("/admin/users?error=super");

  const lifting = !Number.isFinite(days) || days <= 0;
  const until = lifting ? null : new Date(Date.now() + days * 86_400_000);

  await db.user.update({
    where: { id: userId },
    data: { bannedUntil: until, banReason: lifting ? null : reason || "违反社区规范" },
  });

  await db.message.create({
    data: {
      userId,
      type: "SYSTEM",
      title: lifting ? "账号已解除封禁" : `账号已被封禁 ${days} 天`,
      body: lifting
        ? "你的账号封禁已解除，现在可以正常参与讨论与评价。"
        : `原因：${reason || "违反社区规范"}。封禁期间无法发表讨论与评价，如有异议可在「设置 → 我的申诉」提交申诉。`,
      href: "/settings/appeals",
    },
  });

  await writeLog(
    "WARN",
    "user.ban",
    lifting
      ? `解除 @${target.username} 的封禁`
      : `封禁 @${target.username} ${days} 天（${reason || "未填写原因"}）`,
  );

  revalidatePath("/admin/users");
  redirect("/admin/users?ok=ban");
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  // 只有超级管理员能改角色
  const actor = await requireCapability("role.manage");

  const userId = text(formData, "userId");
  const role = text(formData, "role");
  if (!userId) return;

  if (!USER_ROLES.includes(role as UserRole)) redirect("/admin/users?error=role");

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return;

  // 不允许把自己降级，避免把自己锁在门外
  if (userId === actor.id && role !== "SUPER_ADMIN") redirect("/admin/users?error=self");

  // 鑷冲皯瑕佷繚鐣欎竴鍚嶈秴绾х鐞嗗憳
  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const superCount = await db.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superCount <= 1) redirect("/admin/users?error=last");
  }

  await db.user.update({ where: { id: userId }, data: { role: role as UserRole } });
  revalidatePath("/admin/users");
  redirect("/admin/users?ok=role");
}

