import { NextResponse } from "next/server";

import { db } from "@/lib/db";

/** 讨论区 @ 联想：按昵称或用户名搜索用户 */
export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (!query) return NextResponse.json({ users: [] });

  const users = await db.user.findMany({
    where: {
      OR: [
        { username: { startsWith: query, mode: "insensitive" } },
        { displayName: { startsWith: query, mode: "insensitive" } },
      ],
    },
    select: { username: true, displayName: true, avatarUrl: true },
    take: 6,
    orderBy: { points: "desc" },
  });

  return NextResponse.json({ users });
}
