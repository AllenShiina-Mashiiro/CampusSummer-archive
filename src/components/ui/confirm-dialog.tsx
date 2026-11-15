"use client";

import { useEffect, useRef, useState } from "react";

import { XIcon } from "@/components/icons";

/**
 * 站内确认弹窗。
 *
 * 用它替代 window.confirm：浏览器原生弹窗会打断页面观感、无法定制文案与样式，
 * 移动端表现也不一致。确认后调用所在 form 的 requestSubmit()，
 * 因此服务端仍然走普通的表单提交 / Server Action，无需改动动作逻辑。
 */

type Tone = "danger" | "primary";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  tone = "danger",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: Tone;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);

    // 打开时锁滚动，避免背景跟着动
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (!panelRef.current?.contains(event.target as Node)) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[380px] rounded-2xl border border-line bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="关闭"
            className="mt-0.5 text-faint transition-colors hover:text-ink"
          >
            <XIcon size={15} />
          </button>
        </div>

        {description && (
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{description}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-line px-4 py-2 text-[14px] text-ink-soft transition-colors hover:text-ink"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              tone === "danger"
                ? "rounded-xl bg-rose px-4 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
                : "rounded-xl bg-primary px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 表单内的「危险操作」按钮：点击弹窗，确认后提交所在表单 */
export function ConfirmSubmitButton({
  label,
  title,
  description,
  confirmText = "确认删除",
  tone = "danger",
  className,
}: {
  label: string;
  title: string;
  description?: string;
  confirmText?: string;
  tone?: Tone;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function submit() {
    setOpen(false);
    buttonRef.current?.closest("form")?.requestSubmit();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "rounded-lg border border-line px-2.5 py-1 text-[13px] text-muted transition-colors hover:border-rose/40 hover:text-rose"
        }
      >
        {label}
      </button>

      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmText={confirmText}
        tone={tone}
        onCancel={() => setOpen(false)}
        onConfirm={submit}
      />
    </>
  );
}
