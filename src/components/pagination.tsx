import Link from "next/link";

import { ChevronRightIcon } from "@/components/icons";

type Props = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
};

function buildHref(basePath: string, page: number, params?: Props["params"]): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ basePath, currentPage, totalPages, params }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => {
    if (totalPages <= 7) return true;
    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
  });

  return (
    <nav aria-label="分页" className="mt-8 flex items-center justify-center gap-1.5 text-[14px]">
      <PageLink
        href={buildHref(basePath, Math.max(1, currentPage - 1), params)}
        disabled={currentPage === 1}
        label="上一页"
      />
      {pages.map((page, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && page - previous > 1;

        return (
          <span key={page} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-faint">…</span>}
            <Link
              href={buildHref(basePath, page, params)}
              aria-current={page === currentPage ? "page" : undefined}
              className={
                page === currentPage
                  ? "flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-2.5 font-medium text-white"
                  : "flex h-8 min-w-8 items-center justify-center rounded-lg border border-line px-2.5 text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong"
              }
            >
              {page}
            </Link>
          </span>
        );
      })}
      <PageLink
        href={buildHref(basePath, Math.min(totalPages, currentPage + 1), params)}
        disabled={currentPage === totalPages}
        label="下一页"
      />
    </nav>
  );
}

function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  if (disabled) {
    return <span className="px-2 py-1.5 text-faint/60">{label}</span>;
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-0.5 px-2 py-1.5 text-ink-soft transition-colors hover:text-primary-strong"
    >
      {label}
      {label === "下一页" && <ChevronRightIcon size={13} />}
    </Link>
  );
}
