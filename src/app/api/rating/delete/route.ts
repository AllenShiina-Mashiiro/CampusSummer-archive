import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** 撤回自己的评分，并重新聚合条目均分 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const form = await request.formData();
  const ratingId = String(form.get("ratingId") ?? "");
  const slug = String(form.get("slug") ?? "");
  if (!ratingId) return NextResponse.json({ ok: false, error: "缺少参数" }, { status: 400 });

  const rating = await db.rating.findUnique({
    where: { id: ratingId },
    select: { userId: true, gameId: true },
  });

  if (!rating) return NextResponse.json({ ok: false, error: "评分不存在" }, { status: 404 });
  if (rating.userId !== session.id) {
    return NextResponse.json({ ok: false, error: "只能撤回自己的评分" }, { status: 403 });
  }

  await db.rating.delete({ where: { id: ratingId } });

  const aggregate = await db.rating.aggregate({
    where: { gameId: rating.gameId },
    _avg: { score: true },
    _count: { _all: true },
  });

  await db.game.update({
    where: { id: rating.gameId },
    data: {
      rating: Number((aggregate._avg.score ?? 0).toFixed(1)),
      ratingCount: aggregate._count._all,
    },
  });

  updateTag("games");
  if (slug) revalidatePath(`/galgame/${slug}`);

  return NextResponse.json({ ok: true });
}
