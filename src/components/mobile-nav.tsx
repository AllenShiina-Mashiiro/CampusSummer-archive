"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  BellIcon,
  ChevronRightIcon,
  DiceIcon,
  MenuIcon,
  SearchIcon,
  XIcon,
} from "@/components/icons";
import { NAV_ITEMS } from "@/lib/site";

/**
 * 移动端导航。
 *
 * 桌面端的中文导航在 390px 宽度下会把图标挤出屏幕，所以窄屏直接收进抽屉：
 * 一级导航放在抽屉里，搜索 / 随机 / 消息做成三个快捷入口。
 * 抽屉打开时锁滚动、支持 Esc 关闭；所有入口点击后立即收起。
 *
 * 这里刻意不用 usePathname()：Cache Components 下它属于「运行时 URL 数据」，
 * 放在布局里会让每个页面都无法预渲染（本组件只需要关闭行为，不需要高亮当前路由）。
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 抽屉打开时监听浏览器前进/后退，避免用户返回后抽屉还挂在屏幕上。
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="csa-mobile-nav"
        aria-label={open ? "关闭菜单" : "打开菜单"}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
      >
        {open ? <XIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="站点导航">
          <button
            type="button"
            aria-label="关闭菜单"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/25 backdrop-blur-[2px] dark:bg-black/55"
          />

          {/*
            抽屉用不透明面板：它挂在带 backdrop-filter 的顶栏内部，
            嵌套的毛玻璃会失去背景采样，半透明反而让页面文字透上来。
          */}
          <nav
            id="csa-mobile-nav"
            className="absolute inset-x-3 top-[72px] max-h-[calc(100dvh-88px)] overflow-y-auto rounded-2xl border border-hairline bg-surface p-2 shadow-2xl"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex h-11 items-center justify-between rounded-xl px-3 text-[15px] font-medium text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
              >
                {item.label}
                <ChevronRightIcon size={15} className="text-faint" />
              </Link>
            ))}

            <div className="my-1.5 h-px bg-line" aria-hidden />

            <div className="grid grid-cols-3 gap-1.5 p-1">
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1 rounded-xl py-2.5 text-[12.5px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
              >
                <SearchIcon size={18} />
                搜索
              </Link>
              <Link
                href="/api/random"
                prefetch={false}
                aria-label="随机一部游戏"
                className="flex flex-col items-center gap-1 rounded-xl py-2.5 text-[12.5px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
              >
                <DiceIcon size={18} />
                随机
              </Link>
              <Link
                href="/message"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1 rounded-xl py-2.5 text-[12.5px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
              >
                <BellIcon size={18} />
                消息
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
