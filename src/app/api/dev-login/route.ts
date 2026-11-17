import { NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestOrigin } from "@/lib/http";

/**
 * 仅开发环境：直接以某个账号登录，方便本地截图与联调。
 * 生产构建下直接 404，不会被误用。
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const username = url.searchParams.get("as") ?? "allen";
  const rawNext = url.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const origin = requestOrigin(request);

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, role: true },
  });
  if (!user) return new NextResponse("user not found", { status: 404 });

  const response = NextResponse.redirect(new URL(next, origin));
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
  // 顺带标记成年确认，截图与联调时不会被弹窗挡住
  response.cookies.set("csa-age", "1", { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: false });
  return response;
}
