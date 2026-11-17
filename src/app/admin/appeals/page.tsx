import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { handleAppealAction } from "@/app/admin/report-actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "申诉管理", robots: { index: false } };

export default function AppealsPage() {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">申诉管理</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        通过后解除封禁并补偿 300 樱花点；被删除的内容不会恢复。
      </p>

      <Suspense fallback={<div className="mt-5 h-48 animate-pulse rounded-2xl bg-subtle" />}>
        <AppealList />
      </Suspense>
    </div>
  );
}

async function AppealList() {
  await connection();
  await requireCapability("appeal.handle");

  const appeals = await db.appeal.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (appeals.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-dashed border-line bg-surface py-14 text-center text-[14px] text-muted">
        暂无待处理的申诉
      </p>
    );
  }

  const users = await db.user.findMany({
    where: { id: { in: appeals.map((appeal) => appeal.userId) } },
    select: { id: true, username: true, displayName: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="mt-5 space-y-3">
      {appeals.map((appeal) => {
        const user = userMap.get(appeal.userId);
        return (
          <div key={appeal.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-faint">
              <span className="rounded-md bg-subtle px-1.5 py-0.5">{appeal.kind}</span>
              <span>{user?.displayName ?? appeal.userId}</span>
              <span>{formatDate(appeal.createdAt)}</span>
            </div>

            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{appeal.content}</p>

            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
              <form action={handleAppealAction}>
                <input type="hidden" name="id" value={appeal.id} />
                <input type="hidden" name="decision" value="accept" />
                <ConfirmSubmitButton
                  label="恢复并补偿"
                  title="确认通过该申诉？"
                  description="将解除该账号的封禁，并补偿 300 樱花点；用户会收到处理通知。"
                  confirmText="通过申诉"
                  tone="primary"
                  className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-strong"
                />
              </form>
              <form action={handleAppealAction}>
                <input type="hidden" name="id" value={appeal.id} />
                <input type="hidden" name="decision" value="reject" />
                <ConfirmSubmitButton
                  label="驳回"
                  title="确认驳回该申诉？"
                  description="驳回后维持原有处罚，用户会收到驳回通知。"
                  confirmText="确认驳回"
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
