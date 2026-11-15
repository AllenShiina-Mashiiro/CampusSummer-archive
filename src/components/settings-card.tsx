import type { ReactNode } from "react";

/** 设置页的统一卡片：标题+说明 / 内容 / 底部说明+操作 */
export function SettingsCard({
  title,
  description,
  children,
  footer,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="px-6 py-5">
        <h2 className="text-[18px] font-semibold text-ink">{title}</h2>
        {description && (
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{description}</p>
        )}
        <div className="mt-4">{children}</div>
      </div>

      {(footer || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3.5">
          <p className="text-[13px] leading-relaxed text-faint">{footer}</p>
          {action}
        </div>
      )}
    </section>
  );
}

/** 设置页的只读/可编辑输入框样式 */
export const fieldClass =
  "w-full rounded-xl border border-line bg-subtle px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-primary/50 focus:bg-surface";

export function SaveButton({
  formId,
  children = "保存",
  disabled,
}: {
  formId: string;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      form={formId}
      disabled={disabled}
      className="rounded-xl bg-primary px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
