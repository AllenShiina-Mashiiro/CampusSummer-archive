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
      <section className="glass-card flex min-h-[240px] items-center justify-center rounded-[18px] border-dashed text-[14px] text-muted">
        暂无活动
      </section>
    );
  }

  const item = items[index];
  const go = (delta: number) => setIndex((prev) => (prev + delta + items.length) % items.length);

  return (
    <section
      className="glass-panel relative flex min-h-[260px] flex-col overflow-hidden rounded-[18px] sm:min-h-[300px]"
      aria-roledescription="carousel"
      aria-label="站点公告与更新"
    >
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
        {/* 上下一并压暗：白色箭头、圆点在亮色插画上也能看清 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/15" />
      </div>

      {/* 翻页按钮放在图片右上角：卡片贴底时不会压住标题和摘要 */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="上一个"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/85 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-surface"
        >
          <ChevronRightIcon size={15} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="下一个"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/85 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-surface"
        >
          <ChevronRightIcon size={15} />
        </button>
      </div>

      <div className="relative mt-auto flex flex-col p-3 sm:p-3.5">
        <Link
          href={`/docs/${item.slug}`}
          className="block rounded-xl bg-surface/95 p-3.5 shadow-lg shadow-black/10 backdrop-blur-md transition-colors hover:bg-surface"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[10px] font-semibold text-white">
              {item.authorAvatar ? (
                <img src={item.authorAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                item.authorName.slice(0, 1)
              )}
            </span>
            <span className="truncate text-[13.5px] font-medium text-ink">{item.authorName}</span>
          </div>

          <h2 className="mt-2 line-clamp-1 text-[16px] font-semibold text-ink sm:text-[17px]">
            {item.title}
          </h2>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted sm:text-[13.5px]">
            {item.summary ?? "点击查看详情"}
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-[12.5px]">
            <span className="rounded-md bg-primary-soft px-1.5 py-0.5 font-medium text-primary-strong">
              {LABEL[item.category] ?? "文档"}
            </span>
            <span className="text-faint">{formatDate(item.updatedAt)}</span>
          </div>
        </Link>

        <div className="mt-2 flex items-center justify-center gap-1">
          {items.map((entry, dot) => (
            <button
              key={entry.slug}
              type="button"
              onClick={() => setIndex(dot)}
              aria-label={`第 ${dot + 1} 张`}
              aria-current={dot === index}
              className="flex h-6 w-6 items-center justify-center rounded-full"
            >
              <span
                className={
                  dot === index
                    ? "block h-1.5 w-4 rounded-full bg-white shadow-sm transition-all"
                    : "block h-1.5 w-1.5 rounded-full bg-white/55 transition-all hover:bg-white/80"
                }
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
