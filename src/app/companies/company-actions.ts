"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { writeLog } from "@/lib/logger";

/** 编辑会社资料（创作者及以上都可维护） */
export async function updateCompanyAction(formData: FormData): Promise<void> {
  const actor = await requireCapability("game.publish");

  const slug = String(formData.get("slug") ?? "");
  if (!slug) redirect("/companies");

  const name = String(formData.get("name") ?? "").trim();
  const aliases = String(formData.get("aliases") ?? "")
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
  const website = String(formData.get("website") ?? "").trim() || null;
  const mainLanguage = String(formData.get("mainLanguage") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) redirect(`/companies/${slug}?error=name`);

  const company = await db.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) redirect("/companies");

  await db.company.update({
    where: { slug },
    data: { name, aliases, website, mainLanguage, region, description },
  });

  await writeLog(
    "INFO",
    "company.update",
    `@${actor.displayName} 更新了会社「${name}」的资料`,
  );

  revalidatePath(`/companies/${slug}`);
  revalidatePath("/companies");
  redirect(`/companies/${slug}?saved=1`);
}
