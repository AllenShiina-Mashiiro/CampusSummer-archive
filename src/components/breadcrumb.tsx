import Link from "next/link";

import { ChevronRightIcon } from "@/components/icons";

type Crumb = { href?: string; label: string };

/** 面包屑：主页 > 游戏会社 > Atelier Sakura */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="面包屑" className="flex flex-wrap items-center gap-1 text-[14px] text-muted">
      <Link href="/" className="transition-colors hover:text-primary-strong">
        主页
      </Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          <ChevronRightIcon size={13} className="text-faint" />
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

/** 页面标题区：大标题 + 一行说明 */
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
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-2 text-[15px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
