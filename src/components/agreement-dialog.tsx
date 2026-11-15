"use client";

import { useEffect, useState } from "react";

import { XIcon } from "@/components/icons";

/** 用户协议弹窗：内容由站长在「网站设置」里填写 */
export function AgreementButton({
  siteName,
  content,
}: {
  siteName: string;
  content: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary-strong hover:underline"
      >
        《{siteName} 用户协议》
      </button>

      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="用户协议"
            className="flex max-h-[80vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="text-[17px] font-semibold text-ink">用户协议</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="text-faint transition-colors hover:text-ink"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">
                {content || "站长还没有填写用户协议。"}
              </p>
            </div>

            <div className="border-t border-line px-5 py-3 text-right">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-primary px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-primary-strong"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
