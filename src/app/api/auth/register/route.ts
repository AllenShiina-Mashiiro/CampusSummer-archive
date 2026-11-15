import { NextResponse } from "next/server";

import { createSessionToken, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestOrigin } from "@/lib/http";
import { verifyHumanChallenge } from "@/lib/human-challenge";
import {
  NICKNAME_MAX,
  normalizeNickname,
  USERNAME_MAX,
  USERNAME_PATTERN,
} from "@/lib/user-fields";
import { consumeVerificationCode } from "@/lib/verification";

/** 注册：普通表单 POST，成功后直接登录并回首页 */
export async function POST(request: Request) {
  const form = await request.formData();
  const nickname = normalizeNickname(String(form.get("nickname") ?? ""));
  const username = String(form.get("username") ?? "").trim();
  const emailLocal = String(form.get("emailLocal") ?? "").trim();
  const emailDomain = String(form.get("emailDomain") ?? "@qq.com");
  const password = String(form.get("password") ?? "");
  const code = String(form.get("code") ?? "").trim();
  const agreed = form.get("agree") === "on";
  const human = form.get("human") === "on";
  const humanToken = String(form.get("humanToken") ?? "");
  const humanAnswers = [String(form.get("humanAnswer0") ?? ""), String(form.get("humanAnswer1") ?? "")];

  const origin = requestOrigin(request);
  const fail = (codeValue: string) =>
    NextResponse.redirect(new URL(`/register?error=${codeValue}`, origin), { status: 303 });

  // 上线前后可用 REGISTRATION_ENABLED=false 暂时关闭注册
  if (process.env.REGISTRATION_ENABLED === "false") return fail("closed");

  if (!nickname) return fail("nickname");
  if (nickname.length > NICKNAME_MAX) return fail("nickname-long");
  if (!username) return fail("username");
  if (username.length > USERNAME_MAX) return fail("username-long");
  if (!USERNAME_PATTERN.test(username)) return fail("username-format");
  if (!emailLocal || !/^[\w.+-]+$/.test(emailLocal)) return fail("email");
  if (password.length < 6 || !/[0-9]/.test(password) || !/[A-Za-z]/.test(password)) {
    return fail("password");
  }
  if (!agreed) return fail("agree");
  if (!code) return fail("code");
  if (!human) return fail("human");
  if (!(await verifyHumanChallenge(humanToken, humanAnswers))) return fail("human-answer");

  const email = `${emailLocal}${emailDomain}`.toLowerCase();

  const [nameTaken, emailTaken] = await Promise.all([
    db.user.findUnique({ where: { username }, select: { id: true } }),
    db.user.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (nameTaken) return fail("username-taken");
  if (emailTaken) return fail("email-taken");

  // 放在最后消费验证码：前面的校验失败时用户不需要重新收码
  if (!(await consumeVerificationCode(email, code))) return fail("code-invalid");

  const user = await db.user.create({
    data: {
      username,
      email,
      displayName: nickname,
      passwordHash: await hashPassword(password),
      // 公开注册永远只创建普通用户；管理员只能由 CLI 或现有超级管理员授予
      role: "USER",
    },
    select: { id: true, username: true, displayName: true, role: true },
  });

  const response = NextResponse.redirect(new URL("/", origin), { status: 303 });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
  return response;
}
