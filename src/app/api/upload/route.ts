import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { storeUpload } from "@/lib/media";
import { extensionFor, MAX_UPLOAD_BYTES } from "@/lib/storage";

/**
 * 图片上传：封面、截图、文档插图共用。
 * 校验登录 + 发布/设置权限，按白名单限制类型与大小，存储走 S3 或本地适配层。
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.id }, select: { role: true } });
  if (!user || !(can(user.role, "game.publish") || can(user.role, "site.settings"))) {
    return NextResponse.json({ ok: false, error: "没有上传权限" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "缺少文件" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: "文件不能超过 8MB" }, { status: 413 });
  }

  const extension = extensionFor(file.type);
  if (!extension) {
    return NextResponse.json({ ok: false, error: "只支持 PNG / JPEG / WebP / GIF / AVIF" }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storeUpload(buffer, file.type, file.name || `upload.${extension}`, session.id);

  return NextResponse.json({
    ok: true,
    url: stored.url,
    key: stored.key,
    // 内容相同的文件不会重复占用空间
    deduped: stored.deduped,
  });
}
