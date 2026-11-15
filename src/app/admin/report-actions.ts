"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";

/** 举报处置：通过（删除内容 + 可选封禁 / 删号）或驳回 */
export async function handleReportAction(formData: FormData): Promise<void> {
  const actor = await requireCapability("report.handle");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const banDays = Number(formData.get("banDays") ?? 0);
  const deleteAccount = formData.get("deleteAccount") === "on";
  if (!id) return;

  const report = await db.report.findUnique({ where: { id } });
  if (!report || report.status !== "PENDING") redirect("/admin/reports");

  const { writeLog } = await import("@/lib/logger");
  await writeLog(
    "INFO",
    "report.handle",
    `处置举报 ${id}（${report.targetType}）：${decision === "reject" ? "驳回" : `通过${banDays ? `，封禁 ${banDays} 天` : ""}${deleteAccount ? "，删除账号" : ""}`}`,
  );

  const targetUser = report.targetUserId
    ? await db.user.findUnique({
        where: { id: report.targetUserId },
        select: { id: true, role: true, points: true },
      })
    : null;

  if (decision === "reject") {
    await db.report.update({
      where: { id },
      data: { status: "REJECTED", handledById: actor.id, handledAt: new Date() },
    });

    if (targetUser) {
      await db.message.create({
        data: {
          userId: targetUser.id,
          type: "SYSTEM",
          title: "举报无效",
          body: "你被举报的内容经核实未违规，请与大家和善交流。",
        },
      });
    }

    revalidatePath("/admin/reports");
    redirect("/admin/reports");
  }

  // 通过：先删内容
  if (report.targetType === "COMMENT") {
    await db.comment.deleteMany({ where: { id: report.targetId } });
  } else if (report.targetType === "RATING") {
    await db.rating.deleteMany({ where: { id: report.targetId } });
  }

  // 举报人 +100 樱花点
  await db.user.update({
    where: { id: report.reporterId },
    data: { points: { increment: 100 } },
  });

  if (targetUser) {
    if (deleteAccount) {
      await db.user.delete({ where: { id: targetUser.id } });
    } else {
      const until =
        banDays > 0 ? new Date(Date.now() + banDays * 24 * 60 * 60 * 1000) : null;

      await db.user.update({
        where: { id: targetUser.id },
        data: {
          ...(until ? { bannedUntil: until, banReason: report.reason } : {}),
        },
      });

      await db.message.create({
        data: {
          userId: targetUser.id,
          type: "SYSTEM",
          title: "内容违规处理",
          body: until
            ? `你的内容因「${report.reason}」已被删除，并被限制至 ${until.toLocaleDateString("zh-CN")}。请遵守社区规范。`
            : `你的内容因「${report.reason}」已被删除，请注意言行。`,
        },
      });
    }
  }

  await db.message.create({
    data: {
      userId: report.reporterId,
      type: "SYSTEM",
      title: "举报成功",
      body: "感谢你的举报，已核实处理，奖励 100 樱花点。",
    },
  });

  await db.report.update({
    where: { id },
    data: { status: "ACCEPTED", handledById: actor.id, handledAt: new Date() },
  });

  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}

/** 申诉处置：恢复（解除封禁 + 补偿 300 樱花点）或驳回 */
export async function handleAppealAction(formData: FormData): Promise<void> {
  const actor = await requireCapability("appeal.handle");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id) return;

  const appeal = await db.appeal.findUnique({ where: { id } });
  if (!appeal || appeal.status !== "PENDING") redirect("/admin/appeals");

  if (decision === "accept") {
    await db.user.update({
      where: { id: appeal.userId },
      data: { bannedUntil: null, banReason: null, points: { increment: 300 } },
    });
    await db.message.create({
      data: {
        userId: appeal.userId,
        type: "SYSTEM",
        title: "申诉通过",
        body: "你的申诉已通过，账号限制已解除，并补偿 300 樱花点。被删除的内容不会恢复。",
      },
    });
  } else {
    await db.message.create({
      data: {
        userId: appeal.userId,
        type: "SYSTEM",
        title: "申诉被驳回",
        body: "你的申诉经复核未通过，维持原处理结果。",
      },
    });
  }

  await db.appeal.update({
    where: { id },
    data: {
      status: decision === "accept" ? "ACCEPTED" : "REJECTED",
      handledById: actor.id,
      handledAt: new Date(),
    },
  });

  revalidatePath("/admin/appeals");
  redirect("/admin/appeals");
}
