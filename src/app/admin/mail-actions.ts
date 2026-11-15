"use server";

import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { writeLog } from "@/lib/logger";

/**
 * 邮件群发：走 SMTP（配置见 .env 的 SMTP_*）。
 * 支持「只发给测试地址」与「按范围群发」，逐封发送并汇总成功/失败数量。
 */
export async function sendMailAction(formData: FormData): Promise<void> {
  await requireCapability("mail.send");

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all");
  const testTo = String(formData.get("testTo") ?? "").trim();

  if (!subject || !body) redirect("/admin/mail?error=missing");

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT ?? 465);

  if (!host || !user || !pass) {
    redirect("/admin/mail?error=no-smtp");
  }

  // 收件人：填了测试地址就只发给他；否则按范围从库裡取邮箱
  const recipients = testTo
    ? [testTo]
    : (
        await db.user.findMany({
          where:
            audience === "creators"
              ? { role: { in: ["CREATOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"] as "CREATOR"[] } }
              : {},
          select: { email: true },
        })
      ).map((row) => row.email);

  if (recipients.length === 0) redirect("/admin/mail?error=empty");

  const { default: nodemailer } = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  let sent = 0;
  let failed = 0;

  for (const to of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || user,
        to,
        subject,
        text: body,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      await writeLog("WARN", "mail.send", `发送失败 ${to}：${(error as Error).message}`);
    }
  }

  await writeLog(
    failed > 0 ? "WARN" : "INFO",
    "mail.send",
    `群发完成：成功 ${sent}，失败 ${failed}，主题「${subject}」`,
  );

  redirect(`/admin/mail?done=1&sent=${sent}&failed=${failed}`);
}
