"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { notifyAll } from "@/lib/notify";
import { estimateWordCount, slugify } from "@/lib/site";

const CATEGORIES = ["NOTICE", "GUIDE", "POLICY", "ABOUT"] as const;

/** 发布或更新文档 */
export async function saveDocAction(formData: FormData): Promise<void> {
  const actor = await requireCapability("site.settings");

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "GUIDE");
  const category = CATEGORIES.includes(categoryRaw as (typeof CATEGORIES)[number])
    ? (categoryRaw as (typeof CATEGORIES)[number])
    : "GUIDE";

  if (!title || !content) {
    redirect(id ? `/admin/docs?edit=${id}&error=missing` : "/admin/docs?error=missing");
  }

  const summary = String(formData.get("summary") ?? "").trim() || null;
  const coverUrl = String(formData.get("coverUrl") ?? "").trim() || null;
  const wordCount = estimateWordCount(content);

  if (id) {
    const existing = await db.doc.findUnique({ where: { id }, select: { id: true } });
    if (!existing) redirect("/admin/docs?error=missing");

    await db.doc.update({
      where: { id },
      data: { title, summary, content, category, coverUrl, wordCount },
    });
  } else {
    let slug = slugify(title);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const clash = await db.doc.findUnique({ where: { slug }, select: { id: true } });
      if (!clash) break;
      slug = `${slug}-${Math.random().toString(36).slice(2, 4)}`;
    }

    await db.doc.create({
      data: {
        slug,
        title,
        summary,
        content,
        category,
        coverUrl,
        wordCount,
        published: true,
        // 记录发布者，前台「作者」一栏据此显示头像与昵称
        authorId: actor.id,
      },
    });
  }

  updateTag("docs");
  revalidatePath("/docs");
  revalidatePath("/admin/docs");

  await notifyAll({
    type: "DOC",
    title: id ? `文档已更新：${title}` : `新文档发布：${title}`,
    body: summary ?? "点击查看文档内容",
    href: "/docs",
    actorId: actor.id,
    excludeUserId: actor.id,
  });

  redirect("/admin/docs");
}

export async function deleteDocAction(formData: FormData): Promise<void> {
  const actor = await requireCapability("site.settings");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const target = await db.doc.findUnique({ where: { id }, select: { title: true } });

  await db.doc.delete({ where: { id } });
  updateTag("docs");
  revalidatePath("/docs");
  revalidatePath("/admin/docs");

  await notifyAll({
    type: "DOC",
    title: `文档已删除：${target?.title ?? "未命名文档"}`,
    body: "该文档已从帮助文档中移除",
    href: "/docs",
    actorId: actor.id,
    excludeUserId: actor.id,
  });

  redirect("/admin/docs");
}
