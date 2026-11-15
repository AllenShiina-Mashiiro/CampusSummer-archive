import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeLog } from "@/lib/logger";

const TYPES = new Set(["COMMENT", "RATING", "USER"]);

/** 提交举报：讨论 / 评价 / 用户，进入后台「举报管理」 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { targetType?: unknown; targetId?: unknown; reason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  const targetType = String(body.targetType ?? "").toUpperCase();
  const targetId = String(body.targetId ?? "").trim();
  const reason = String(body.reason ?? "").trim().slice(0, 500);

  if (!TYPES.has(targetType) || !targetId || reason.length < 2) {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  let targetUserId: string | null = null;

  if (targetType === "COMMENT") {
    const comment = await db.comment.findUnique({
      where: { id: targetId },
      select: { userId: true },
    });
    if (!comment) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    targetUserId = comment.userId;
  } else if (targetType === "RATING") {
    const rating = await db.rating.findUnique({
      where: { id: targetId },
      select: { userId: true },
    });
    if (!rating) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    targetUserId = rating.userId;
  } else {
    const target = await db.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    targetUserId = target.id;
  }

  if (targetUserId === session.id) {
    return NextResponse.json({ ok: false, error: "self" }, { status: 400 });
  }

  const existing = await db.report.findFirst({
    where: {
      reporterId: session.id,
      targetType,
      targetId,
      status: "PENDING",
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const report = await db.report.create({
    data: {
      targetType,
      targetId,
      targetUserId,
      reporterId: session.id,
      reason,
    },
    select: { id: true },
  });

  await writeLog("INFO", "report.create", `新举报 ${report.id}（${targetType}）：${reason}`);

  return NextResponse.json({ ok: true });
}
