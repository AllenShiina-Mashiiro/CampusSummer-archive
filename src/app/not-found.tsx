import Link from "next/link";

import { SITE } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef4ff] to-[#f6efff] text-3xl dark:from-[#1a2233] dark:to-[#221b33]">
        ✧
      </div>

      <h1 className="mt-6 text-[25px] font-semibold tracking-tight text-ink">页面不存在</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
        这个条目可能已被合并、重命名，或者从未存在过。
        {SITE.name} 的条目 slug 一旦发布就不会改动，如果你是从旧链接过来的，可以在搜索里重新找一次。
      </p>

      <div className="mt-6 flex items-center gap-2">
        <Link
          href="/galgame"
          className="rounded-xl bg-primary px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
        >
          浏览全部条目
        </Link>
        <Link
          href="/search"
          className="rounded-xl border border-line px-4 py-2 text-[14px] text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong"
        >
          搜索
        </Link>
      </div>
    </div>
  );
}
