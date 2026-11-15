import type { Metadata } from "next";
import { Suspense } from "react";

import { requireCapability } from "@/lib/admin-guard";
import { listLogs } from "@/lib/logger";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "管理日志", robots: { index: false } };

const LEVEL_STYLE: Record<string, string> = {
  ERROR: "bg-rose-soft text-rose",
  WARN: "bg-[#fef3c7] text-[#b45309] dark:bg-[#332a12] dark:text-[#fbbf24]",
  INFO: "bg-subtle text-muted",
};

export default function AdminLogsPage() {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">管理日志</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        记录站点运行中的错误与关键操作；没有记录时说明一切正常。
      </p>

      <Suspense fallback={<div className="mt-5 h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <LogList />
      </Suspense>
    </div>
  );
}

async function LogList() {
  await requireCapability("logs.view");
  const logs = await listLogs(100);

  if (logs.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-dashed border-line bg-surface py-16 text-center text-[14px] text-muted">
        暂无日志，一切正常
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="rounded-xl border border-line bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className={`rounded-md px-1.5 py-0.5 font-medium ${LEVEL_STYLE[log.level] ?? LEVEL_STYLE.INFO}`}>
              {log.level}
            </span>
            <span className="text-ink">{log.source || "site"}</span>
            <span className="text-faint">{formatDate(log.createdAt)}</span>
          </div>
          <p className="mt-1.5 break-words text-[13.5px] leading-relaxed text-ink-soft">{log.message}</p>
        </div>
      ))}
    </div>
  );
}
