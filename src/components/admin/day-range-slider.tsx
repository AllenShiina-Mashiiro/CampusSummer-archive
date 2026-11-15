"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** 「设置天数」滑块：拖动后写回查询参数，1–60 天 */
export function DayRangeSlider() {
  const router = useRouter();
  const params = useSearchParams();

  const raw = Number(params.get("days") ?? 1);
  const days = Number.isFinite(raw) ? Math.min(60, Math.max(1, raw)) : 1;

  function commit(value: number) {
    const search = new URLSearchParams(params.toString());
    search.set("days", String(value));
    router.push(`/admin?${search.toString()}`);
  }

  return (
    <div className="flex items-center gap-5">
      <span className="shrink-0 text-[15px] text-ink">设置天数</span>

      <div className="flex min-w-0 flex-1 flex-col">
        <input
          type="range"
          min={1}
          max={60}
          value={days}
          onChange={(event) => commit(Number(event.target.value))}
          aria-label="统计天数"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-primary"
          style={{
            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((days - 1) / 59) * 100}%, var(--color-line) ${((days - 1) / 59) * 100}%, var(--color-line) 100%)`,
          }}
        />
        <span className="mt-2 text-[13px] text-faint">1 - 60 天</span>
      </div>

      <span className="shrink-0 rounded-xl bg-primary-soft px-4 py-2 text-[14.5px] font-medium text-primary-strong">
        {days} 天
      </span>
    </div>
  );
}
