"use client";

import Link from "next/link";
import { useState } from "react";

import { ChevronRightIcon } from "@/components/icons";
import type { ActivityItem } from "@/lib/docs";
import { formatDate } from "@/lib/site";

const LABEL: Record<string, string> = {
  NOTICE: "公告",
  GUIDE: "文档",
  POLICY: "协议",
  ABOUT: "关于",
};

/** 首页活动轮播：左右翻页 + 圆点，卡片样式对齐参考站 */
export function ActivityCarousel({
  items,
  fallbackCover,
}: {
  items: ActivityItem[];
  fallbackCover?: string;
}) {
  const [index, setIndex] = useState(0);

  if (items.length === 0) {
    return (
      <section className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-line bg-surface text-[14px] text-muted">
        暂无活动
      </section>
    );
  }

  const item = items[index];
  const go = (delta: number) => setIndex((prev) => (prev + delta + items.length) % items.length);

  return (
    <section className="relative min-h-[240px] overflow-hidden rounded-2xl border border-line">
      <div className="absolute inset-0">
        {item.coverUrl || fallbackCover ? (
          <img
            src={item.coverUrl ?? fallbackCover}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#dbeafe] via-[#ede9fe] to-[#fce7f3] dark:from-[#1a2233] dark:via-[#221b33] dark:to-[#2a1b2b]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="上一个"
        className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-sm transition-colors hover:bg-white"
      >
        <ChevronRightIcon size={14} className="rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="下一个"
        className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-sm transition-colors hover:bg-white"
      >
        <ChevronRightIcon size={14} />
      </button>

      <div className="relative flex h-full flex-col justify-end p-3.5">
        <Link href={`/docs/${item.slug}`} className="block rounded-xl bg-surface/95 p-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[10px] font-semibold text-white">
              {item.authorAvatar ? (
                <img src={item.authorAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                item.authorName.slice(0, 1)
              )}
            </span>
            <span className="text-[14px] font-medium text-ink">{item.authorName}</span>
          </div>

          <h2 className="mt-2 line-clamp-1 text-[17px] font-semibold text-ink">{item.title}</h2>
          <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
            {item.summary ?? "点击查看详情"}
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-[13px]">
            <span className="rounded-md bg-primary-soft px-1.5 py-0.5 font-medium text-primary-strong">
              {LABEL[item.category] ?? "文档"}
            </span>
            <span className="text-faint">{formatDate(item.updatedAt)}</span>
          </div>
        </Link>

        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {items.map((entry, dot) => (
            <button
              key={entry.slug}
              type="button"
              onClick={() => setIndex(dot)}
              aria-label={`第 ${dot + 1} 张`}
              className={
                dot === index
                  ? "h-1.5 w-4 rounded-full bg-primary transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-white/70 transition-all"
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
