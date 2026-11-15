import { NextResponse } from "next/server";

import { getSiteName } from "@/lib/site-settings";
import { sendVerificationCode } from "@/lib/verification";

const ALLOWED_DOMAINS = new Set(["qq.com", "163.com", "gmail.com", "outlook.com", "foxmail.com"]);

/** 简单的进程内限流：同一 IP 每分钟最多请求 6 次 */
const hits = new Map<string, number[]>();

function allow(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 6) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

/** 发送注册邮箱验证码 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  if (!allow(ip)) {
    return NextResponse.json({ ok: false, error: "rate-limit" }, { status: 429 });
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
  }

  const match = /^([\w.+-]+)@([a-z0-9.-]+\.[a-z]{2,})$/i.exec(email);
  if (!match || !ALLOWED_DOMAINS.has(match[2].toLowerCase())) {
    return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
  }

  const siteName = await getSiteName();
  const result = await sendVerificationCode(email, siteName);
  if (!result.ok) {
    const status = result.error === "too-soon" ? 429 : 503;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
