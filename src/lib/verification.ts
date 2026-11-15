import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { db } from "./db";
import { env } from "./env";
import { sendMail } from "./mailer";

/** 验证码有效期 10 分钟，同一邮箱 60 秒内只能发一次 */
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${env.authSecret}:${email}:${code}`).digest("hex");
}

export type SendCodeResult =
  | { ok: true }
  | { ok: false; error: "too-soon" | "smtp" | "send" };

/** 生成并发送注册邮箱验证码 */
export async function sendVerificationCode(
  email: string,
  siteName: string,
): Promise<SendCodeResult> {
  const now = new Date();
  const recent = await db.verificationCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recent && now.getTime() - recent.createdAt.getTime() < RESEND_INTERVAL_MS) {
    return { ok: false, error: "too-soon" };
  }

  // 清理该邮箱的历史验证码与已过期验证码，避免无限增长
  await db.verificationCode.deleteMany({
    where: { OR: [{ email }, { expiresAt: { lt: now } }] },
  });

  const code = String(randomInt(100_000, 1_000_000));
  await db.verificationCode.create({
    data: {
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
    },
  });

  const result = await sendMail({
    to: email,
    subject: `【${siteName}】注册验证码`,
    text: `你的注册验证码是 ${code}，10 分钟内有效。\n如果这不是你本人的操作，请忽略这封邮件。`,
    html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.7;color:#111827">
      <p>你正在注册 <strong>${siteName}</strong>。</p>
      <p>验证码：<strong style="font-size:22px;letter-spacing:4px">${code}</strong></p>
      <p style="color:#6b7280">验证码 10 分钟内有效。如果这不是你本人的操作，请忽略这封邮件。</p>
    </div>`,
  });

  if (!result.ok) {
    await db.verificationCode.deleteMany({ where: { email } });
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

/** 校验并消费验证码；错误次数过多或过期都会失败 */
export async function consumeVerificationCode(email: string, code: string): Promise<boolean> {
  if (!code.trim()) return false;

  const row = await db.verificationCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return false;

  if (row.expiresAt.getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS) {
    await db.verificationCode.delete({ where: { id: row.id } }).catch(() => undefined);
    return false;
  }

  const expected = Buffer.from(row.codeHash);
  const given = Buffer.from(hashCode(email, code.trim()));
  const matches = expected.length === given.length && timingSafeEqual(expected, given);

  if (!matches) {
    await db.verificationCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  await db.verificationCode.delete({ where: { id: row.id } });
  return true;
}
