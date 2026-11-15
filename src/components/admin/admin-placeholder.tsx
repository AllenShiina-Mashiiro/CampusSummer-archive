import type { ReactNode } from "react";

/**
 * 管理面板的占位模块：结构先对齐参考站，具体功能待接。
 * 明确写清「尚未实现」，避免看起来像坏了。
 */
export function AdminPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-[14px] text-muted">{description}</p>

      <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-[21px] text-faint">
          ◌
        </div>
        <p className="mt-3 text-[14.5px] text-ink-soft">该模块尚未实现</p>
        <p className="mt-1 text-[13.5px] text-muted">
          当前版本先完成版式与入口，业务逻辑待接入。
        </p>
      </div>
    </div>
  );
}

/** 管理表格：统一样式，避免每个列表页重复写 thead/tbody 骨架 */
export function AdminTable({
  head,
  children,
  empty,
}: {
  head: ReactNode;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-[14px]">
        <thead className="bg-subtle text-[13px] text-muted">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {empty ? (
            <tr>
              <td colSpan={12} className="px-5 py-14 text-center text-[14px] text-muted">
                暂无数据
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={`px-5 py-3 font-medium ${className ?? ""}`}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-5 py-3 text-ink-soft ${className ?? ""}`}>{children}</td>;
}
