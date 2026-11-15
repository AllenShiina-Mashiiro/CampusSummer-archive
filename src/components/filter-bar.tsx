"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CheckIcon, ChevronDownIcon, SlidersIcon, SortIcon } from "@/components/icons";

const SORT_OPTIONS = [
  { value: "updated", label: "资源更新时间" },
  { value: "rating", label: "评分" },
  { value: "views", label: "浏览量" },
] as const;

const PLATFORMS = ["PC", "PE", "Android"];
const LANGUAGES = ["简体中文", "日本語"];

/**
 * 列表页筛选条：排序、升降序、高级筛选。
 * 状态全部落在 URL 查询参数上，刷新与分享都能复现同样的结果。
 */
export function FilterBar({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();

  const sort = params.get("sort") ?? "updated";
  const dir = params.get("dir") ?? "desc";
  const platform = params.get("platform");
  const language = params.get("language");

  const [openMenu, setOpenMenu] = useState<"sort" | "advanced" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openMenu]);

  function update(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    // 改筛选条件时回到第一页
    if (!("page" in next)) search.delete("page");
    router.push(`/galgame${search.toString() ? `?${search}` : ""}`);
  }

  const activeFilters = [platform, language].filter(Boolean).length;
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "资源更新时间";

  return (
    <div
      ref={containerRef}
      className="my-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
          aria-expanded={openMenu === "sort"}
          className="flex items-center gap-1.5 rounded-lg bg-subtle px-3 py-1.5 text-[14px] text-ink-soft transition-colors hover:text-ink"
        >
          {sortLabel}
          <ChevronDownIcon size={14} className="text-faint" />
        </button>

        {openMenu === "sort" && (
          <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-40 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lg">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  update({ sort: option.value });
                  setOpenMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[14px] text-ink-soft transition-colors hover:bg-subtle"
              >
                {option.label}
                {sort === option.value && <CheckIcon size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => update({ dir: dir === "desc" ? "asc" : "desc" })}
        className="flex items-center gap-1.5 rounded-lg bg-subtle px-3 py-1.5 text-[14px] text-ink-soft transition-colors hover:text-ink"
      >
        <SortIcon size={14} className="text-faint" />
        {dir === "desc" ? "降序" : "升序"}
      </button>

      <span className="ml-1 text-[13.5px] text-faint">共 {total} 个条目</span>

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "advanced" ? null : "advanced")}
          aria-expanded={openMenu === "advanced"}
          className="flex items-center gap-1.5 rounded-lg bg-subtle px-3 py-1.5 text-[14px] text-ink-soft transition-colors hover:text-ink"
        >
          <SlidersIcon size={14} className="text-faint" />
          高级筛选
          {activeFilters > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-white">
              {activeFilters}
            </span>
          )}
          <ChevronDownIcon size={14} className="text-faint" />
        </button>

        {openMenu === "advanced" && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-64 rounded-xl border border-line bg-surface p-3 shadow-lg">
            <p className="mb-2 text-[13px] font-medium text-muted">平台</p>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => update({ platform: platform === item ? null : item })}
                  className={
                    platform === item
                      ? "rounded-md bg-violet-soft px-2 py-1 text-[13px] font-medium text-violet ring-1 ring-violet/40"
                      : "rounded-md bg-violet-soft px-2 py-1 text-[13px] font-medium text-violet opacity-70"
                  }
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="mb-2 mt-3 text-[13px] font-medium text-muted">语言</p>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => update({ language: language === item ? null : item })}
                  className={
                    language === item
                      ? "rounded-md bg-mint-soft px-2 py-1 text-[13px] font-medium text-mint ring-1 ring-mint/40"
                      : "rounded-md bg-mint-soft px-2 py-1 text-[13px] font-medium text-mint opacity-70"
                  }
                >
                  {item}
                </button>
              ))}
            </div>

            {(activeFilters > 0 || sort !== "updated" || dir !== "desc") && (
              <button
                type="button"
                onClick={() => router.push("/galgame")}
                className="mt-3 w-full rounded-lg border border-line py-1.5 text-[13.5px] text-muted transition-colors hover:text-ink"
              >
                重置全部条件
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
