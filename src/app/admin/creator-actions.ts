"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";

/** 提交创作者申请 */
export async function submitCreatorApplication(formData: FormData): Promise<void> {
  const { requireUser } = await import("@/lib/admin-guard");
  const me = await requireUser();

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) redirect("/settings/creator?error=reason");

  const pending = await db.creatorApplication.findFirst({
    where: { userId: me.id, status: "PENDING" },
    select: { id: true },
  });
  if (pending) redirect("/settings/creator?error=pending");

  await db.creatorApplication.create({
    data: {
      userId: me.id,
      reason,
      identity: String(formData.get("identity") ?? "").trim() || null,
      works: String(formData.get("works") ?? "").trim() || null,
      contact: String(formData.get("contact") ?? "").trim() || null,
    },
  });

  revalidatePath("/settings/creator");
  redirect("/settings/creator?ok=1");
}

/** 审核：通过则升级为创作者，拒绝则通知 */
export async function reviewCreatorApplication(formData: FormData): Promise<void> {
  const actor = await requireCapability("creator.review");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id) return;

  const application = await db.creatorApplication.findUnique({ where: { id } });
  if (!application || application.status !== "PENDING") redirect("/admin/creators");

  if (decision === "accept") {
    await db.user.update({ where: { id: application.userId }, data: { role: "CREATOR" } });
    await db.message.create({
      data: {
        userId: application.userId,
        type: "SYSTEM",
        title: "创作者申请已通过",
        body: "恭喜！你已成为创作者，可以在创作中心发布游戏与资源。",
      },
    });
  } else {
    await db.message.create({
      data: {
        userId: application.userId,
        type: "SYSTEM",
        title: "创作者申请未通过",
        body: "本次申请未通过，补充作品说明后可再次提交。",
      },
    });
  }

  await db.creatorApplication.update({
    where: { id },
    data: {
      status: decision === "accept" ? "ACCEPTED" : "REJECTED",
      handledById: actor.id,
      handledAt: new Date(),
    },
  });

  revalidatePath("/admin/creators");
  redirect("/admin/creators");
}
