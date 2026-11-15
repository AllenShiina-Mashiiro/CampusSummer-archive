"use client";

import { useEffect, useState } from "react";

import { BookIcon } from "@/components/icons";
import type { Heading } from "@/lib/toc";

/**
 * 本页面索引（带滚动高亮）。
 * 用 IntersectionObserver 监听正文标题，滚到哪个小节就高亮对应条目。
 */
export function DocToc({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 取当前进入视口、位置最靠上的那个标题
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      // 顶部留出 header 高度，底部多留一些避免频繁切换
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  return (
    <div className="sticky top-20 rounded-xl border border-line bg-surface p-3">
      <p className="flex items-center gap-1.5 px-2 py-1.5 text-[13.5px] font-medium text-ink">
        <BookIcon size={14} />
        本页面索引
      </p>

      {headings.length === 0 ? (
        <p className="mt-1 rounded-lg bg-subtle px-3 py-2 text-[13px] text-faint">
          此页面暂无标题索引
        </p>
      ) : (
        <nav className="mt-1 space-y-0.5">
          {headings.map((heading) => {
            const active = heading.id === activeId;

            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className={[
                  "block rounded-lg px-3 py-1.5 transition-colors",
                  heading.level === 3 ? "pl-6 text-[13px]" : "text-[13.5px]",
                  active
                    ? "bg-primary-soft font-medium text-primary-strong"
                    : "text-muted hover:bg-subtle hover:text-ink",
                ].join(" ")}
              >
                {heading.text}
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}
