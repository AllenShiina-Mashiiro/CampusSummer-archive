"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/admin-guard";
import { verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

const KEYS = [
  "siteName",
  "adminEmail",
  "logoUrl",
  "heroTitle",
  "heroDescription",
  "backgroundUrl",
  "backgroundOverlay",
  "bannerUrl",
  "activityLeft",
  "activityRight",
  "checkinImageUrl",
  "checkinTitle",
  "checkinText",
  "agreement",
  "githubUrl",
  "telegramUrl",
  "contactText",
] as const;

/** 保存站点设置（超管） */
export async function saveSiteSettings(formData: FormData): Promise<void> {
  await requireCapability("site.settings");

  for (const key of KEYS) {
    const value = String(formData.get(key) ?? "").trim();
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value, updatedAt: new Date() },
    });
  }

  updateTag("settings");
  revalidatePath("/", "layout");
  redirect("/admin/settings?ok=1");
}

/** 把当前超级管理员账号绑定到管理员邮箱（需要当前密码确认） */
export async function bindAdminEmail(formData: FormData): Promise<void> {
  const actor = await requireCapability("site.settings");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/settings?error=admin-email");
  }

  const current = await db.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true },
  });
  if (!current || !(await verifyPassword(password, current.passwordHash))) {
    redirect("/admin/settings?error=admin-password");
  }

  const taken = await db.user.findFirst({
    where: { email, id: { not: actor.id } },
    select: { id: true },
  });
  if (taken) redirect("/admin/settings?error=admin-email-taken");

  await db.user.update({ where: { id: actor.id }, data: { email } });
  await db.siteSetting.upsert({
    where: { key: "adminEmail" },
    create: { key: "adminEmail", value: email },
    update: { value: email, updatedAt: new Date() },
  });

  updateTag("settings");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?ok=admin-bound");
}

/** 新增或编辑一条友情链接（超管） */
export async function saveFriendLink(formData: FormData): Promise<void> {
  await requireCapability("site.settings");

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!title || !url) redirect("/admin/settings?error=friend");

  if (id) {
    await db.friendLink.update({
      where: { id },
      data: { title, url, description, imageUrl, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 },
    });
  } else {
    await db.friendLink.create({
      data: { title, url, description, imageUrl, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 },
    });
  }

  updateTag("friends");
  revalidatePath("/", "layout");
  revalidatePath("/friends");
  redirect("/admin/settings?ok=1");
}

/** 删除一条友情链接（超管） */
export async function deleteFriendLink(formData: FormData): Promise<void> {
  await requireCapability("site.settings");

  const id = String(formData.get("id") ?? "").trim();
  if (id) await db.friendLink.delete({ where: { id } });

  updateTag("friends");
  revalidatePath("/", "layout");
  revalidatePath("/friends");
  redirect("/admin/settings?ok=1");
}
