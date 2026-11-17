import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { storeUpload } from "@/lib/media";
import { extensionFor, MAX_UPLOAD_BYTES } from "@/lib/storage";

/** 校验文件真实签名，不能只相信浏览器提交的 Content-Type。 */
function matchesImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/png") {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/gif") {
    return buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6));
  }
  if (mimeType === "image/webp") {
    return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  }
  if (mimeType === "image/avif") {
    return buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp" &&
      ["avif", "avis"].includes(buffer.toString("ascii", 8, 12));
  }
  return false;
}

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
  if (!matchesImageSignature(buffer, file.type)) {
    return NextResponse.json({ ok: false, error: "文件内容与图片格式不匹配" }, { status: 415 });
  }

  const stored = await storeUpload(buffer, file.type, file.name || `upload.${extension}`, session.id);

  return NextResponse.json({
    ok: true,
    url: stored.url,
    key: stored.key,
    // 内容相同的文件不会重复占用空间
    deduped: stored.deduped,
  });
}
