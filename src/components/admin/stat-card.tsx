import type { ReactNode } from "react";

/** 管理面板的统计卡片：标题 + 数值（无数据时显示破折号，和参考站一致） */
export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-5">
      <p className="text-[15px] text-ink-soft">{label}</p>
      <p className="mt-6 text-[25px] font-semibold text-ink">
        {value === null || value === undefined ? (
          <span className="inline-block h-[3px] w-10 rounded-full bg-ink align-middle" aria-label="暂无数据" />
        ) : (
          value.toLocaleString("zh-CN")
        )}
      </p>
    </div>
  );
}

/** 管理面板的通用区块标题 + 内容容器 */
export function AdminSection({
  title,
  children,
  action,
}: {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-7 first:border-0 first:pt-0">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-[23px] font-semibold tracking-tight text-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
