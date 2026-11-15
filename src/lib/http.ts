import type { NextRequest } from "next/server";

/**
 * 取请求真实来源。
 * Next 在 dev 下会把 request.url 的 host 归一化成 localhost，
 * 如果浏览器访问的是 127.0.0.1，跳转后 Cookie 就带不过去了——所以优先用 Host 头。
 */
export function requestOrigin(request: Request | NextRequest): string {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
