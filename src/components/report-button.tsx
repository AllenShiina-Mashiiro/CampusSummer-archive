"use client";

import { useState } from "react";

import { XIcon } from "@/components/icons";

const REASONS = ["垃圾广告", "人身攻击", "违法违规", "侵犯版权", "其他"];

/**
 * 举报按钮：讨论 / 评价 / 用户共用。
 * 提交后写入 Report 表，由后台「举报管理」统一处置。
 */
export function ReportButton({
  targetType,
  targetId,
  label = "内容",
}: {
  targetType: "COMMENT" | "RATING" | "USER";
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const text = detail.trim() ? `${reason}：${detail.trim()}` : reason;
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason: text }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        duplicate?: boolean;
      };

      if (data.ok) {
        setMessage(data.duplicate ? "你已经举报过这条内容，管理员正在处理" : "举报已提交");
        setDetail("");
        window.setTimeout(() => {
          setOpen(false);
          setMessage(null);
        }, 1200);
      } else if (data.error === "unauthorized") {
        setMessage("请先登录后再举报");
      } else if (data.error === "self") {
        setMessage("不能举报自己的内容");
      } else {
        setMessage("提交失败，请稍后重试");
      }
    } catch {
      setMessage("提交失败，请检查网络");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12.5px] text-faint transition-colors hover:text-rose"
      >
        举报
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
            aria-label={`举报${label}`}
            className="w-full max-w-[380px] rounded-2xl border border-line bg-surface p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">举报{label}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="text-faint transition-colors hover:text-ink"
              >
                <XIcon size={15} />
              </button>
            </div>

            <p className="mt-1.5 text-[13px] text-muted">请选择举报原因，管理员会在核实后处理。</p>

            <div className="mt-3 space-y-2">
              {REASONS.map((item) => (
                <label
                  key={item}
                  className={
                    reason === item
                      ? "flex cursor-pointer items-center gap-2 rounded-lg border border-primary/50 bg-primary-soft px-3 py-2 text-[13.5px] text-ink"
                      : "flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13.5px] text-ink-soft"
                  }
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reason === item}
                    onChange={() => setReason(item)}
                    className="accent-primary"
                  />
                  {item}
                </label>
              ))}
            </div>

            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              rows={3}
              maxLength={300}
              placeholder="补充说明（可选）"
              className="mt-3 w-full resize-y rounded-xl border border-line bg-subtle px-3 py-2 text-[13.5px] text-ink outline-none focus:border-primary/50 focus:bg-surface"
            />

            {message && (
              <p className="mt-2 rounded-lg bg-subtle px-3 py-2 text-[13px] text-ink-soft">
                {message}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-line px-4 py-2 text-[13.5px] text-ink-soft"
              >
                取消
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="rounded-xl bg-rose px-4 py-2 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "提交中…" : "提交举报"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
