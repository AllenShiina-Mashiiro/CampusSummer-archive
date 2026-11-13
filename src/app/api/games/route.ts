import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const tag = searchParams.get("tag")?.trim() ?? "";
  const games = await prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }] } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: { id: true, slug: true, title: true, summary: true, coverUrl: true, developer: true, releaseDate: true, platforms: true, tags: true },
  });
  return NextResponse.json({ data: games, count: games.length });
}
