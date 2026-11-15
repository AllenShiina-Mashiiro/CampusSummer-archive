import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { handleReportAction } from "@/app/admin/report-actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "举报管理", robots: { index: false } };

const TYPES = [
  { key: "COMMENT", label: "讨论举报" },
  { key: "RATING", label: "评价举报" },
  { key: "USER", label: "用户举报" },
] as const;

export default function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">举报管理</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        通过后删除被举报内容、给举报人 +100 樱花点，并可选择封禁时长或删号。
      </p>

      <Suspense fallback={<div className="mt-5 h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <ReportList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ReportList({ searchParams }: { searchParams: PageProps<"/admin/reports">["searchParams"] }) {
  await requireCapability("report.handle");

  const params = (await searchParams) ?? {};
  const type = TYPES.some((item) => item.key === params.type) ? String(params.type) : "COMMENT";

  const counts = await db.report.groupBy({
    by: ["targetType"],
    where: { status: "PENDING" },
    _count: { _all: true },
  });

  const reports = await db.report.findMany({
    where: { status: "PENDING", targetType: type },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  // 解析跳转目标
  const commentIds = reports.filter((r) => r.targetType === "COMMENT").map((r) => r.targetId);
  const ratingIds = reports.filter((r) => r.targetType === "RATING").map((r) => r.targetId);
  const userIds = reports.filter((r) => r.targetType === "USER").map((r) => r.targetId);

  const [comments, ratings, users] = await Promise.all([
    commentIds.length
      ? db.comment.findMany({
          where: { id: { in: commentIds } },
          select: { id: true, content: true, game: { select: { slug: true, title: true } } },
        })
      : Promise.resolve([]),
    ratingIds.length
      ? db.rating.findMany({
          where: { id: { in: ratingIds } },
          select: { id: true, score: true, game: { select: { slug: true, title: true } } },
        })
      : Promise.resolve([]),
    userIds.length
      ? db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, displayName: true },
        })
      : Promise.resolve([]),
  ]);

  const targets = new Map<string, { label: string; href: string }>();
  for (const comment of comments) {
    targets.set(comment.id, {
      label: `${comment.game.title} · ${comment.content.slice(0, 24)}`,
      href: `/galgame/${comment.game.slug}?tab=comments`,
    });
  }
  for (const rating of ratings) {
    targets.set(rating.id, {
      label: `${rating.game.title} · ${rating.score.toFixed(1)} 分`,
      href: `/galgame/${rating.game.slug}?tab=ratings`,
    });
  }
  for (const user of users) {
    targets.set(user.id, {
      label: `${user.displayName}（@${user.username}）`,
      href: `/user/${user.username}`,
    });
  }

  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {TYPES.map((item) => {
          const count = counts.find((row) => row.targetType === item.key)?._count._all ?? 0;
          const active = item.key === type;
          return (
            <Link
              key={item.key}
              href={`/admin/reports?type=${item.key}`}
              className={
                active
                  ? "rounded-2xl border border-primary/40 bg-primary-soft px-5 py-4"
                  : "card-hover rounded-2xl border border-line bg-surface px-5 py-4"
              }
            >
              <p className="text-[14.5px] text-ink">{item.label}</p>
              <p className="mt-2 text-[23px] font-semibold text-ink">{count}</p>
              <p className="mt-1 text-[12.5px] text-faint">待审核</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {reports.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line bg-surface py-14 text-center text-[14px] text-muted">
            当前分类没有待审核的举报
          </p>
        )}

        {reports.map((report) => {
          const target = targets.get(report.targetId);
          return (
            <div key={report.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-faint">
                <span className="rounded-md bg-subtle px-1.5 py-0.5">
                  {TYPES.find((item) => item.key === report.targetType)?.label ?? report.targetType}
                </span>
                <span>{formatDate(report.createdAt)}</span>
              </div>

              <p className="mt-2 text-[14.5px] text-ink">理由：{report.reason}</p>

              {target ? (
                <Link href={target.href} className="mt-1 inline-block text-[13.5px] text-primary-strong hover:underline">
                  查看被举报内容：{target.label}
                </Link>
              ) : (
                <p className="mt-1 text-[13.5px] text-faint">目标内容可能已被删除</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <form action={handleReportAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={report.id} />
                  <input type="hidden" name="decision" value="accept" />
                  <select
                    name="banDays"
                    defaultValue="0"
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-[13px] text-ink-soft"
                  >
                    <option value="0">不封禁</option>
                    <option value="1">封禁 1 天</option>
                    <option value="2">封禁 2 天</option>
                    <option value="5">封禁 5 天</option>
                    <option value="10">封禁 10 天</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                    <input type="checkbox" name="deleteAccount" className="h-3.5 w-3.5 accent-rose" />
                    删除账号
                  </label>
                  <ConfirmSubmitButton
                    label="通过并处置"
                    title="确认通过该举报？"
                    description="将删除被举报内容并向举报人发放 100 樱花点；是否封禁、封禁天数与删除账号以左侧当前选择为准，确认后立即生效。"
                    confirmText="通过并执行"
                    tone="primary"
                    className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-strong"
                  />
                </form>

                <form action={handleReportAction}>
                  <input type="hidden" name="id" value={report.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <ConfirmSubmitButton
                    label="驳回"
                    title="确认驳回该举报？"
                    description="驳回后不会删除内容，也不会处罚被举报者；举报人会收到驳回通知。"
                    confirmText="确认驳回"
                    className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink"
                  />
                </form>

                {report.targetUserId && (
                  <Link
                    href={`/admin/users`}
                    className="text-[13px] text-muted hover:text-ink"
                  >
                    去用户管理
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
