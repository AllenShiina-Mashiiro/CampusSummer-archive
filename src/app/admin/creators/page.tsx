import type { Metadata } from "next";
import { Suspense } from "react";

import { reviewCreatorApplication } from "@/app/admin/creator-actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "创作者申请", robots: { index: false } };

export default function AdminCreatorsPage() {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">创作者申请</h1>
      <p className="mt-1.5 text-[14px] text-muted">通过后该用户角色变为创作者，可发布游戏与资源。</p>

      <Suspense fallback={<div className="mt-5 h-48 animate-pulse rounded-2xl bg-subtle" />}>
        <ApplicationList />
      </Suspense>
    </div>
  );
}

async function ApplicationList() {
  await requireCapability("creator.review");

  const applications = await db.creatorApplication.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (applications.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-dashed border-line bg-surface py-14 text-center text-[14px] text-muted">
        暂无待审核的申请
      </p>
    );
  }

  const users = await db.user.findMany({
    where: { id: { in: applications.map((item) => item.userId) } },
    select: { id: true, username: true, displayName: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="mt-5 space-y-3">
      {applications.map((application) => {
        const user = userMap.get(application.userId);
        return (
          <div key={application.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-faint">
              <span className="font-medium text-ink">{user?.displayName ?? application.userId}</span>
              {user && <span>@{user.username}</span>}
              <span>{formatDate(application.createdAt)}</span>
            </div>

            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">原因：{application.reason}</p>
            <dl className="mt-2 grid gap-1 text-[13.5px] text-muted sm:grid-cols-3">
              <div>身份：{application.identity ?? "—"}</div>
              <div>作品：{application.works ?? "—"}</div>
              <div>联系方式：{application.contact ?? "—"}</div>
            </dl>

            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
              <form action={reviewCreatorApplication}>
                <input type="hidden" name="id" value={application.id} />
                <input type="hidden" name="decision" value="accept" />
                <ConfirmSubmitButton
                  label="通过"
                  title={`通过「${user?.displayName ?? application.userId}」的创作者申请？`}
                  description="通过后该用户角色变为创作者，可以进入创作中心发布游戏与资源。"
                  confirmText="通过申请"
                  tone="primary"
                  className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-strong"
                />
              </form>
              <form action={reviewCreatorApplication}>
                <input type="hidden" name="id" value={application.id} />
                <input type="hidden" name="decision" value="reject" />
                <ConfirmSubmitButton
                  label="拒绝"
                  title="确认拒绝该创作者申请？"
                  description="拒绝后用户可以再次提交申请，你会收到新的待审记录。"
                  confirmText="确认拒绝"
                  className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink"
                />
              </form>
            </div>
          </div>
        );
      })}
    </div>
  );
}
