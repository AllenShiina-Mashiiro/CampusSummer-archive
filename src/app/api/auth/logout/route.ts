import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth";

/** 退出登录：清掉会话 cookie，前端随后 router.refresh() 重渲染顶栏 */
export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
