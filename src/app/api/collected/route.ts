import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET：查询当前用户是否已收藏该条目 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ collected: false });

  const gameId = new URL(request.url).searchParams.get("gameId") ?? "";
  if (!gameId) return NextResponse.json({ collected: false });

  const row = await db.collection.findUnique({
    where: { gameId_userId: { userId: session.id, gameId } },
    select: { userId: true },
  });

  return NextResponse.json({ collected: Boolean(row) });
}

/** POST：切换收藏状态，返回最新状态与收藏数 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { gameId?: string };
  const gameId = body.gameId ?? "";
  if (!gameId) return NextResponse.json({ ok: false, error: "缺少 gameId" }, { status: 400 });

  const existing = await db.collection.findUnique({
    where: { gameId_userId: { userId: session.id, gameId } },
    select: { userId: true },
  });

  if (existing) {
    await db.collection.delete({ where: { gameId_userId: { userId: session.id, gameId } } });
  } else {
    await db.collection.create({ data: { userId: session.id, gameId } });
  }

  const count = await db.collection.count({ where: { gameId } });

  return NextResponse.json({ ok: true, collected: !existing, count });
}
