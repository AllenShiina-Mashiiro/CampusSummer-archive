import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelFromPoints } from "@/lib/level";

const CHECKIN_POINTS = 10;

/** 今日签到：每天一次，+10 樱花点 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { points: true, lastCheckIn: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  const now = new Date();
  if (user.lastCheckIn) {
    const last = new Date(user.lastCheckIn);
    const sameDay =
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate();
    if (sameDay) {
      return NextResponse.json({
        ok: false,
        error: "already",
        points: user.points,
        level: levelFromPoints(user.points).level,
      });
    }
  }

  const updated = await db.user.update({
    where: { id: session.id },
    data: { points: { increment: CHECKIN_POINTS }, lastCheckIn: now },
    select: { points: true },
  });

  return NextResponse.json({
    ok: true,
    gained: CHECKIN_POINTS,
    points: updated.points,
    level: levelFromPoints(updated.points).level,
  });
}
