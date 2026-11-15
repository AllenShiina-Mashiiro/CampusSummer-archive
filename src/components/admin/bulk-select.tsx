"use client";

import { useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * 批量操作工具栏：全选 + 已选计数 + 删除按钮。
 *
 * 计数通过监听所在 form 的 change 事件实时计算；
 * 删除走站内确认弹窗（不用 window.confirm），确认后 requestSubmit 提交表单。
 */
export function BulkToolbar({
  noun = "资源",
  action = "批量删除",
  hint,
}: {
  noun?: string;
  action?: string;
  hint?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;

    const read = () => {
      const boxes = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="ids"]'));
      const checked = boxes.filter((box) => box.checked).length;
      setSelected(checked);
      if (selectAllRef.current) {
        selectAllRef.current.checked = boxes.length > 0 && checked === boxes.length;
        selectAllRef.current.indeterminate = checked > 0 && checked < boxes.length;
      }
    };

    read();
    form.addEventListener("change", read);
    return () => form.removeEventListener("change", read);
  }, []);

  function toggleAll(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.checked;
    const form = rootRef.current?.closest("form");
    form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((input) => {
      input.checked = next;
    });
    setSelected(next ? (form?.querySelectorAll('input[name="ids"]').length ?? 0) : 0);
  }

  function submit() {
    setOpen(false);
    rootRef.current?.closest("form")?.requestSubmit();
  }

  return (
    <>
      <div
        ref={rootRef}
        className="mb-3 flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-2.5"
      >
        <label className="flex items-center gap-2 text-[13.5px] text-ink-soft">
          <input
            ref={selectAllRef}
            type="checkbox"
            onChange={toggleAll}
            aria-label={`全选${noun}`}
            className="h-3.5 w-3.5 accent-primary"
          />
          全选
          <span className="text-faint">
            {selected > 0 ? `已选 ${selected} 项` : (hint ?? `勾选后可${action}`)}
          </span>
        </label>

        <button
          type="button"
          disabled={selected === 0}
          onClick={() => setOpen(true)}
          className="rounded-lg border border-rose/40 px-3 py-1.5 text-[13px] font-medium text-rose transition-colors hover:bg-rose-soft disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:opacity-60"
        >
          {action}
        </button>
      </div>

      <ConfirmDialog
        open={open}
        title={`删除选中的 ${selected} 项${noun}？`}
        description="删除后相关数据会一并清除，此操作不可撤销。"
        confirmText={`删除 ${selected} 项`}
        onCancel={() => setOpen(false)}
        onConfirm={submit}
      />
    </>
  );
}
