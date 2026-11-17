import { BellBadge } from "@/components/bell-badge";

import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { BellIcon, DiceIcon, SearchIcon } from "@/components/icons";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { NAV_ITEMS } from "@/lib/site";

export async function SiteHeader() {
  const settings = await getSiteSettings();

  return (
    <header className="glass-bar sticky top-0 z-50">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-2 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
          <LogoMark logoUrl={settings.logoUrl} />
          <span className="truncate text-[17px] font-bold tracking-tight text-ink sm:text-[18px]">
            {settings.siteName}
          </span>
        </Link>

        {/* 桌面端导航；窄屏收进右侧菜单，避免中文导航在手机上和图标挤成一条 */}
        <nav aria-label="主导航" className="hidden items-center gap-1 text-[15.5px] text-ink-soft lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-2 transition-colors hover:bg-subtle hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <Link
            href="/search"
            aria-label="搜索"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-subtle hover:text-ink sm:flex sm:h-9 sm:w-9"
          >
            <SearchIcon size={19} />
          </Link>
          <Link
            href="/api/random"
            aria-label="随机一部游戏"
            title="随机一部游戏"
            prefetch={false}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-subtle hover:text-ink md:flex md:h-9 md:w-9"
          >
            <DiceIcon size={19} />
          </Link>
          <ThemeToggle />
          <Suspense
            fallback={
              <Link
                href="/message"
                aria-label="消息"
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-subtle hover:text-ink sm:h-9 sm:w-9"
              >
                <BellIcon size={19} />
              </Link>
            }
          >
            <BellArea />
          </Suspense>

          <Suspense fallback={<div className="ml-1 h-8 w-8 rounded-full bg-subtle" />}>
            <UserArea
              checkin={{
                imageUrl: settings.checkinImageUrl,
                title: settings.checkinTitle,
                text: settings.checkinText,
              }}
            />
          </Suspense>

          <MobileNav />
        </div>
      </div>
    </header>
  );
}

/** 铃铛：登录后显示未读数 */
async function BellArea() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/message"
        aria-label="消息"
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-subtle hover:text-ink sm:h-9 sm:w-9"
      >
        <BellIcon size={19} />
      </Link>
    );
  }

  return <BellBadge userId={user.id} />;
}

/** 读会话属于运行时数据，单独包一层 Suspense，顶栏其余部分保持静态 */
async function UserArea({
  checkin,
}: {
  checkin: { imageUrl: string; title: string; text: string };
}) {
  // 显式声明「请求时渲染」：否则预渲染阶段会尝试读 cookie，
  // jwtVerify 内部读当前时间会命中 Next 的 unstable value 检查并抛错。
  await connection();

  const user = await getCurrentUser();
  return (
    <UserMenu
      checkin={checkin}
      user={
        user
          ? {
              displayName: user.displayName,
              username: user.username,
              avatarUrl: user.avatarUrl,
              points: user.points,
              role: user.role,
            }
          : null
      }
    />
  );
}

function LogoMark({ logoUrl }: { logoUrl: string }) {
  if (logoUrl) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <defs>
          <linearGradient id="csa-logo" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f472b6" />
            <stop offset="0.55" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d="M14 2.5c1.2 4.4 3.1 6.3 7.5 7.5-4.4 1.2-6.3 3.1-7.5 7.5-1.2-4.4-3.1-6.3-7.5-7.5C10.9 8.8 12.8 6.9 14 2.5Z"
          fill="url(#csa-logo)"
        />
        <path
          d="M20.5 16.5c.6 2.2 1.5 3.1 3.7 3.7-2.2.6-3.1 1.5-3.7 3.7-.6-2.2-1.5-3.1-3.7-3.7 2.2-.6 3.1-1.5 3.7-3.7Z"
          fill="url(#csa-logo)"
          opacity="0.75"
        />
        <circle cx="8" cy="21" r="2.2" fill="url(#csa-logo)" opacity="0.55" />
      </svg>
    </span>
  );
}
