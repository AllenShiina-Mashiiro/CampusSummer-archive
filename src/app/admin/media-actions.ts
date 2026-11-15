"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/admin-guard";
import { writeLog } from "@/lib/logger";
import { cleanupOrphans } from "@/lib/media";

/** 清理未被任何位置引用的图片（数据库记录 + 磁盘文件） */
export async function cleanupOrphansAction(): Promise<void> {
  await requireCapability("site.settings");

  const removed = await cleanupOrphans();
  await writeLog("INFO", "media.cleanup", `清理孤儿图片 ${removed} 个`);

  revalidatePath("/admin/media");
  redirect(`/admin/media?cleaned=${removed}`);
}
