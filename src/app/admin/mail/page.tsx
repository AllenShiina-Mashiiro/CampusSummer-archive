import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { sendMailAction } from "@/app/admin/mail-actions";
import { fieldClass } from "@/components/settings-card";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "邮件群发", robots: { index: false } };

const ERRORS: Record<string, string> = {
  missing: "主题和正文都不能为空",
  "no-smtp": "服务端没有配置 SMTP（检查 .env 里的 SMTP_HOST / SMTP_USER / SMTP_PASS）",
  empty: "收件人列表为空",
};

export default function AdminMailPage({ searchParams }: PageProps<"/admin/mail">) {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">邮件群发</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        通过 SMTP 发送站内通知邮件；建议先用「测试收件人」发一封确认格式与可达性。
      </p>

      <Suspense fallback={<div className="mt-5 h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <MailForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MailForm({ searchParams }: { searchParams: PageProps<"/admin/mail">["searchParams"] }) {
  await connection();
  await requireCapability("mail.send");

  const params = (await searchParams) ?? {};
  const done = params.done === "1";
  const sent = typeof params.sent === "string" ? params.sent : "0";
  const failed = typeof params.failed === "string" ? params.failed : "0";
  const error = typeof params.error === "string" ? params.error : undefined;

  const [all, creators] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: { in: ["CREATOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"] } } }),
  ]);

  const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  return (
    <>
      {done && (
        <p className="mt-4 rounded-xl bg-mint-soft px-4 py-2.5 text-[14px] text-mint">
          发送完成：成功 {sent} 封{failed !== "0" ? `，失败 ${failed} 封（详见管理日志）` : ""}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose">
          {ERRORS[error] ?? "发送失败"}
        </p>
      )}

      <form action={sendMailAction} className="mt-5 space-y-3 rounded-2xl border border-line bg-surface p-5">
        <div className="rounded-xl bg-subtle px-4 py-3 text-[13.5px] text-muted">
          SMTP：
          <strong className={smtpReady ? "text-mint" : "text-rose"}>
            {smtpReady ? "已配置" : "未配置"}
          </strong>
          <span className="mx-2 text-line">|</span>
          全部用户 <strong className="text-ink">{all}</strong> 位，创作者及以上{" "}
          <strong className="text-ink">{creators}</strong> 位
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13.5px] font-medium text-ink">收件人范围</span>
            <select name="audience" defaultValue="all" className={`${fieldClass} mt-1.5`}>
              <option value="all">全部用户（{all}）</option>
              <option value="creators">创作者及以上（{creators}）</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[13.5px] font-medium text-ink">测试收件人</span>
            <span className="ml-1 text-[12.5px] text-faint">填了只发给它</span>
            <input name="testTo" type="email" placeholder="you@example.com" className={`${fieldClass} mt-1.5`} />
          </label>
        </div>

        <label className="block">
          <span className="text-[13.5px] font-medium text-ink">主题</span>
          <input name="subject" required className={`${fieldClass} mt-1.5`} />
        </label>

        <label className="block">
          <span className="text-[13.5px] font-medium text-ink">正文</span>
          <textarea name="body" rows={8} required className={`${fieldClass} mt-1.5 resize-y`} />
        </label>

        <div className="flex items-center justify-between">
          <p className="text-[12.5px] text-faint">
            注意：种子用户邮箱是 example.com，真实发送会退信，请优先用测试收件人。
          </p>
          <button
            type="submit"
            disabled={!smtpReady}
            className="rounded-xl bg-primary px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </form>
    </>
  );
}
