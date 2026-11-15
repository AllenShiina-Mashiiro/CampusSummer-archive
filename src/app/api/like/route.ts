import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type Kind = "comment" | "rating";

function tableOf(kind: string): { like: string; target: string; column: string } | null {
  if (kind === "comment") {
    return { like: "CommentLike", target: "Comment", column: "commentId" };
  }
  if (kind === "rating") {
    return { like: "RatingLike", target: "Rating", column: "ratingId" };
  }
  return null;
}

/** 查询当前用户是否已点赞 + 当前点赞数 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") ?? "";
  const id = params.get("id") ?? "";
  const meta = tableOf(kind);
  if (!meta || !id) return NextResponse.json({ liked: false, count: 0 });

  const session = await getSession();

  const counted = await db.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM "${meta.like}" WHERE "${meta.column}" = $1`,
    id,
  );

  let liked = false;
  if (session) {
    const mine = await db.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "${meta.like}" WHERE "${meta.column}" = $1 AND "userId" = $2 LIMIT 1`,
      id,
      session.id,
    );
    liked = mine.length > 0;
  }

  return NextResponse.json({ liked, count: Number(counted[0]?.count ?? 0) });
}

/** 点赞 / 取消点赞 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { kind?: string; id?: string };
  const meta = tableOf(body.kind ?? "");
  const id = body.id ?? "";
  if (!meta || !id) return NextResponse.json({ ok: false, error: "参数不正确" }, { status: 400 });

  const existing = await db.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "${meta.like}" WHERE "${meta.column}" = $1 AND "userId" = $2 LIMIT 1`,
    id,
    session.id,
  );

  if (existing.length > 0) {
    await db.$executeRawUnsafe(`DELETE FROM "${meta.like}" WHERE id = $1`, existing[0].id);
  } else {
    await db.$executeRawUnsafe(
      `INSERT INTO "${meta.like}" (id, "${meta.column}", "userId") VALUES ($1, $2, $3)`,
      randomUUID(),
      id,
      session.id,
    );
  }

  const counted = await db.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM "${meta.like}" WHERE "${meta.column}" = $1`,
    id,
  );

  return NextResponse.json({
    ok: true,
    liked: existing.length === 0,
    count: Number(counted[0]?.count ?? 0),
  });
}
