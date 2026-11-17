import Link from "next/link";

import { ChevronRightIcon } from "@/components/icons";

type Crumb = { href?: string; label: string };

/** 面包屑：主页 > 游戏会社 > Atelier Sakura */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="面包屑" className="crumb-pill w-fit max-w-full text-[13px] text-muted">
      <Link href="/" className="transition-colors hover:text-primary-strong">
        主页
      </Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          <ChevronRightIcon size={12} className="text-faint" />
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-primary-strong">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink-soft">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * 页面标题区：大标题 + 一行说明。
 * 标题压在实色面板上，避免背景图上的文字忽明忽暗。
 */
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-head flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[24px] font-semibold tracking-tight text-ink sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
