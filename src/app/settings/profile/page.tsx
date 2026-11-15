import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SaveButton, SettingsCard } from "@/components/settings-card";
import { submitProfile } from "@/app/settings/actions";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NICKNAME_MAX, USERNAME_MAX } from "@/lib/user-fields";

export const metadata: Metadata = {
  title: "个人资料",
  robots: { index: false },
};

export default function ProfileSettingsPage({ searchParams }: PageProps<"/settings/profile">) {
  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <ProfileForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProfileForm({
  searchParams,
}: {
  searchParams: PageProps<"/settings/profile">["searchParams"];
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/settings/profile");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { username: true, displayName: true, avatarUrl: true, bio: true, points: true },
  });
  if (!user) redirect("/login");

  const params = (await searchParams) ?? {};
  const notice = {
    ok: typeof params.ok === "string" ? params.ok : undefined,
    err: typeof params.err === "string" ? params.err : undefined,
  };

  const initial = user.displayName.slice(0, 1).toUpperCase();

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

      <form id="profile-form" action={submitProfile}>
        <SettingsCard
          title="头像"
          description="用于个人主页、评论和消息中的身份识别。"
          footer="头像不是必须，但清晰头像能让其他用户更容易认出您。"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[14.5px] font-medium text-ink">上传新的头像图片</p>
              <p className="mt-1 text-[13.5px] text-muted">
                点击头像选择图片，裁剪后会立即用于站内展示。
              </p>
            </div>

            <label className="group relative cursor-pointer">
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary text-[23px] font-semibold text-white transition-opacity group-hover:opacity-90">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <input
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                className="sr-only"
              />
            </label>
          </div>
        </SettingsCard>

        <div className="mt-4">
          <SettingsCard
            title="昵称"
            description="昵称会显示在主页、评论和消息中，可以使用中文、字母等。"
            footer={`最多 ${NICKNAME_MAX} 个字符。`}
          >
            <div className="rounded-xl bg-subtle px-3.5 py-2.5">
              <p className="text-[12.5px] text-muted">昵称</p>
              <input
                name="displayName"
                defaultValue={user.displayName}
                maxLength={NICKNAME_MAX}
                className="mt-0.5 w-full bg-transparent text-[14.5px] text-ink outline-none"
              />
            </div>
          </SettingsCard>
        </div>

        <div className="mt-4">
          <SettingsCard
            title="用户名"
            description="用户名用于登录和个人主页地址，只能使用字母、数字和下划线。"
            footer={`用户名最长 ${USERNAME_MAX} 个字符，只能包含字母、数字和下划线。`}
            action={<SaveButton formId="profile-form" />}
          >
            <div className="rounded-xl bg-subtle px-3.5 py-2.5">
              <p className="text-[12.5px] text-muted">用户名</p>
              <input
                name="username"
                defaultValue={user.username}
                maxLength={USERNAME_MAX}
                className="mt-0.5 w-full bg-transparent text-[14.5px] text-ink outline-none"
              />
            </div>
          </SettingsCard>
        </div>

        <div className="mt-4">
          <SettingsCard
            title="签名"
            description="签名会显示在您的个人主页，用一句话介绍自己或当前状态。"
            footer="最多 100 个字符。"
          >
            <div className="rounded-xl bg-subtle px-3.5 py-2.5">
              <p className="text-[12.5px] text-muted">签名</p>
              <textarea
                name="signature"
                rows={3}
                maxLength={100}
                defaultValue={user.bio ?? ""}
                placeholder="写点什么…"
                className="mt-0.5 w-full resize-none bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
              />
            </div>
          </SettingsCard>
        </div>
      </form>
    </>
  );
}
