import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 后台与创作中心的入口拦截。
 *
 * 为什么需要它：`requireAdmin()` 里的 redirect() 发生在流式渲染开始之后，
 * 生产模式下响应已是 200，HTML 里会先吐出后台外壳再靠客户端跳转——
 * 等于把侧边栏结构泄露给未授权用户。proxy 在渲染前执行，可以返回真正的 307。
 *
 * 这里只校验 JWT 与角色声明（乐观拦截）；具体资源权限仍在各页面/动作内复核。
 */

const SESSION_COOKIE = "csa_session";
const STAFF = new Set(["MODERATOR", "ADMIN", "SUPER_ADMIN"]);
const CREATOR = new Set(["CREATOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"]);

async function readRole(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return typeof payload.role === "string" ? payload.role : "USER";
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await readRole(request.cookies.get(SESSION_COOKIE)?.value);

  if (!role) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && !STAFF.has(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/creator") && !CREATOR.has(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/creator/:path*"],
};
