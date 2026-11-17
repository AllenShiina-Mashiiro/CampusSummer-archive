import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { cleanupOrphansAction } from "@/app/admin/media-actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { requireCapability } from "@/lib/admin-guard";
import { scanMedia } from "@/lib/media";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "媒体库", robots: { index: false } };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMediaPage({ searchParams }: PageProps<"/admin/media">) {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">媒体库</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        上传按内容哈希去重；删除条目后不再被引用的图片会显示为「孤儿」，可一键清理。
      </p>

      <Suspense fallback={<div className="mt-5 h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <MediaOverview searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MediaOverview({ searchParams }: { searchParams: PageProps<"/admin/media">["searchParams"] }) {
  await connection();
  await requireCapability("site.settings");

  const params = (await searchParams) ?? {};
  const cleaned = typeof params.cleaned === "string" ? params.cleaned : undefined;
  const { stats, orphans, rows } = await scanMedia();
  const orphanIds = new Set(orphans.map((row) => row.id));

  return (
    <>
      {cleaned && (
        <p className="mt-4 rounded-xl bg-mint-soft px-4 py-2.5 text-[14px] text-mint">
          已清理 {cleaned} 个孤儿文件
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-[13.5px] text-muted">文件总数</p>
          <p className="mt-1.5 text-[23px] font-semibold text-ink">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-[13.5px] text-muted">占用空间</p>
          <p className="mt-1.5 text-[23px] font-semibold text-ink">{formatBytes(stats.bytes)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-[13.5px] text-muted">孤儿文件</p>
          <p className={`mt-1.5 text-[23px] font-semibold ${stats.orphans > 0 ? "text-rose" : "text-ink"}`}>
            {stats.orphans}
          </p>
        </div>
      </div>

      {stats.orphans > 0 && (
        <form action={cleanupOrphansAction} className="mt-4 flex items-center justify-between rounded-2xl border border-rose/25 bg-surface px-5 py-4">
          <p className="text-[13.5px] text-muted">
            这些文件不再被任何条目、文档或头像引用，删除后不可恢复。
          </p>
          <ConfirmSubmitButton
            label={`清理 ${stats.orphans} 个孤儿文件`}
            title={`清理 ${stats.orphans} 个孤儿文件？`}
            description="这些文件不再被任何条目、文档或头像引用。删除后无法恢复，建议先确认列表内容。"
            confirmText="确认清理"
            className="rounded-xl border border-rose/40 px-4 py-2 text-[13.5px] font-medium text-rose transition-colors hover:bg-rose-soft"
          />
        </form>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-subtle text-[13px] text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">预览</th>
              <th className="px-5 py-3 font-medium">文件</th>
              <th className="px-5 py-3 font-medium">大小</th>
              <th className="px-5 py-3 font-medium">上传时间</th>
              <th className="px-5 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {stats.total === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[14px] text-muted">
                  还没有上传过图片
                </td>
              </tr>
            )}

            {[...orphans, ...rows.filter((row) => !orphanIds.has(row.id))].map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-2">
                  <img src={row.url} alt="" className="h-10 w-16 rounded border border-line object-cover" />
                </td>
                <td className="px-5 py-2 text-ink-soft">{row.filename}</td>
                <td className="px-5 py-2 text-ink-soft">{formatBytes(row.size)}</td>
                <td className="px-5 py-2 text-ink-soft">{formatDate(row.createdat)}</td>
                <td className="px-5 py-2">
                  {orphanIds.has(row.id) ? (
                    <span className="rounded-md bg-rose-soft px-1.5 py-0.5 text-[12.5px] text-rose">孤儿</span>
                  ) : (
                    <span className="rounded-md bg-mint-soft px-1.5 py-0.5 text-[12.5px] text-mint">引用中</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
