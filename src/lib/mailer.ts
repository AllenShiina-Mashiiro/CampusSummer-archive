import { env, isSmtpEnabled } from "./env";

export type MailResult = { ok: true } | { ok: false; error: "smtp" | "send" };

/**
 * 统一邮件发送入口（注册验证码、后台群发都走这里）。
 * SMTP 未配置时返回 smtp，调用方据此给出可读的错误提示。
 */
export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<MailResult> {
  if (!isSmtpEnabled) return { ok: false, error: "smtp" };

  try {
    const { default: nodemailer } = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });

    await transporter.sendMail({
      from: env.smtp.from || env.smtp.user,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return { ok: true };
  } catch (error) {
    console.error("[mail] 发送失败:", error);
    return { ok: false, error: "send" };
  }
}
