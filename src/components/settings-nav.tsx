"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BellIcon, CommentIcon, ShieldIcon, SlidersIcon, UserIcon } from "@/components/icons";

const ITEMS = [
  { href: "/settings/profile", label: "个人资料", icon: <UserIcon size={17} /> },
  { href: "/settings/security", label: "账号安全", icon: <ShieldIcon size={17} /> },
  { href: "/settings/notifications", label: "通知与隐私", icon: <BellIcon size={17} /> },
  { href: "/settings/content", label: "网站内容显示", icon: <SlidersIcon size={17} /> },
  { href: "/settings/appeals", label: "内容申诉", icon: <CommentIcon size={17} /> },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="h-fit rounded-2xl border border-line bg-surface p-2">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex items-center gap-3 rounded-xl bg-primary px-4 py-2.5 text-[14.5px] font-medium text-white"
                : "flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14.5px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
            }
          >
            <span className={active ? "text-white" : "text-muted"}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
