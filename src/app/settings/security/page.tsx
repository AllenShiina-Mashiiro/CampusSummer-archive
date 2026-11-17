import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { submitPassword } from "@/app/settings/actions";
import { ExternalLinkIcon } from "@/components/icons";
import { SaveButton, SettingsCard, fieldClass } from "@/components/settings-card";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "账号安全",
  robots: { index: false },
};

export default function SecuritySettingsPage({
  searchParams,
}: PageProps<"/settings/security">) {
  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <SecurityForms searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SecurityForms({
  searchParams,
}: {
  searchParams: PageProps<"/settings/security">["searchParams"];
}) {
  await connection();
  const session = await getSession();
  if (!session) redirect("/login?next=/settings/security");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { email: true },
  });

  const params = (await searchParams) ?? {};
  const notice = {
    ok: typeof params.ok === "string" ? params.ok : undefined,
    err: typeof params.err === "string" ? params.err : undefined,
  };

  return (
    <>
      {(notice.ok || notice.err) && (
        <p
          role="status"
          className={
            notice.err
              ? "rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose"
              : "rounded-xl bg-mint-soft px-4 py-2.5 text-[14px] text-mint"
          }
        >
          {notice.err ?? notice.ok}
        </p>
      )}

      <SettingsCard
        title="邮箱"
        description="邮箱用于密码恢复和重要安全通知，请确保可以正常接收邮件。"
        footer="如果新邮箱未收到验证码，请检查垃圾邮件或全部邮件。"
        action={<SaveButton formId="email-form" disabled />}
      >
        <div className="rounded-xl border border-line bg-subtle/60 px-4 py-3">
          <p className="text-[14px] font-medium text-ink">验证流程</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
            先向新邮箱发送验证码，保存时再通过当前密码或 2FA 确认本人操作。
          </p>
        </div>

        <form id="email-form" className="mt-3 space-y-3">
          <div className="rounded-xl bg-subtle px-3.5 py-2.5">
            <p className="text-[12.5px] text-muted">当前邮箱</p>
            <p className="mt-0.5 text-[14.5px] text-ink">{user?.email ?? "—"}</p>
          </div>

          <div className="rounded-xl bg-subtle px-3.5 py-2.5">
            <p className="text-[12.5px] text-muted">新邮箱</p>
            <input
              name="email"
              type="email"
              placeholder="请输入您的新邮箱"
              className="mt-0.5 w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-subtle px-3.5 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-muted">新邮箱验证码</p>
              <input
                name="code"
                placeholder="输入邮箱验证码"
                className="mt-0.5 w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
              />
            </div>
            <button
              type="button"
              disabled
              title="需要先配置邮件服务（SMTP）"
              className="shrink-0 text-[13.5px] font-medium text-faint"
            >
              发送验证码
            </button>
          </div>
        </form>

        <p className="mt-2 text-[12.5px] text-faint">
          邮箱变更依赖邮件服务，当前实例未配置 SMTP，因此该功能暂不可用。
        </p>
      </SettingsCard>

      <form id="password-form" action={submitPassword}>
        <SettingsCard
          title="密码"
          description="输入当前密码后设置新密码，保存成功后需要重新登录。"
          footer="密码长度为 6 到 1000 个字符，至少包含数字和英语字母，可包含 @#$%^&*()_-+=V 等特殊字符。"
          action={<SaveButton formId="password-form" />}
        >
          <div className="space-y-3">
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="旧密码"
              required
              className={fieldClass}
            />
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="新密码"
              required
              minLength={6}
              className={fieldClass}
            />
          </div>

          <p className="mt-3 flex items-center gap-1 text-[13.5px] text-faint">
            忘记密码？
            <a
              href="/docs/contact"
              className="inline-flex items-center gap-0.5 text-primary-strong hover:underline"
            >
              联系管理员重置
              <ExternalLinkIcon size={12} />
            </a>
          </p>
        </SettingsCard>
      </form>
    </>
  );
}
