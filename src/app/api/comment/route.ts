import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { updateTag } from "next/cache";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** 修改自己的评论 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const form = await request.formData();
  const commentId = String(form.get("commentId") ?? "");
  const slug = String(form.get("slug") ?? "");
  const content = String(form.get("content") ?? "").trim();

  if (!commentId || !content) {
    return NextResponse.json({ ok: false, error: "内容不能为空" }, { status: 400 });
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) return NextResponse.json({ ok: false, error: "评论不存在" }, { status: 404 });
  if (comment.userId !== session.id) {
    return NextResponse.json({ ok: false, error: "只能修改自己的评论" }, { status: 403 });
  }

  await db.comment.update({
    where: { id: commentId },
    data: { content: content.slice(0, 1000) },
  });

  updateTag("games");
  if (slug) revalidatePath(`/galgame/${slug}`);

  return NextResponse.json({ ok: true });
}
