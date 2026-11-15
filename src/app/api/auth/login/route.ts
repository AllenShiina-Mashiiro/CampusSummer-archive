import { NextResponse } from "next/server";

import { authenticate, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { requestOrigin } from "@/lib/http";

/**
 * 登录：普通表单 POST，成功后写 Cookie 并 303 回目标页。
 * 不用 Server Action 是因为这里需要精确控制 Cookie 与跳转响应。
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const identifier = String(form.get("identifier") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const rawNext = String(form.get("next") ?? "/");
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const origin = requestOrigin(request);
  const fail = (code: string) =>
    NextResponse.redirect(
      new URL(`/login?error=${code}&next=${encodeURIComponent(next)}`, origin),
      { status: 303 },
    );

  if (!identifier || !password) return fail("empty");

  const user = await authenticate(identifier, password);
  if (!user) return fail("invalid");

  const response = NextResponse.redirect(new URL(next, origin), { status: 303 });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
  return response;
}
