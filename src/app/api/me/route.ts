import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

/** 返回当前登录用户 id，供客户端组件判断「是否本人内容」 */
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ id: session?.id ?? null, username: session?.username ?? null });
}
