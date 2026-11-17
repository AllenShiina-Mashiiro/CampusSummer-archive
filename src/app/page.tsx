import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import {
  BookIcon,
  ChevronRightIcon,
  CommentIcon,
  GamepadIcon,
  SparklesIcon,
  TagIcon,
} from "@/components/icons";
import { GameGrid, GameGridSkeleton } from "@/components/game-card";
import { TimeAgo } from "@/components/time-ago";
import { ActivityCarousel } from "@/components/activity-carousel";
import { getBlockedTagSlugs, getBlockedGameIds } from "@/lib/blocked-tags";
import { getActivityItems } from "@/lib/docs";
import { getFriendLinks } from "@/lib/friends";
import { getLatestGames, getLatestPatches } from "@/lib/games";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE } from "@/lib/site";

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6 sm:py-6">
      {/* 左列：介绍卡 + 三个入口；右列：公告横幅通高。窄屏直接上下堆叠 */}
      <div className="grid items-stretch gap-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <HeroCard title={settings.heroTitle} description={settings.heroDescription} />
          <QuickLinks />
        </div>
        <Suspense
          fallback={<div className="min-h-[260px] animate-pulse rounded-[18px] bg-card" />}
        >
          <HomeActivity />
        </Suspense>
      </div>

      <section className="mt-7 sm:mt-8">
        <SectionBar title="最新游戏" href="/galgame" />

        <Suspense fallback={<GameGridSkeleton count={8} />}>
          <LatestGames />
        </Suspense>
      </section>

      <section className="mt-8 sm:mt-10">
        <SectionBar title="最新补丁" href="/galgame" />

        <Suspense fallback={<PatchSkeleton />}>
          <LatestPatches />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <HomeFriends />
      </Suspense>
    </div>
  );
}

function HeroCard({ title, description }: { title: string; description: string }) {
  const heroTitle = title.trim() || "一站式游戏文化档案库";
  const heroDescription =
    description.trim() ||
    "非商业的作品与创作脉络整理项目，条目化收录作品、会社、版本与术语。";

  return (
    <section className="glass-panel relative overflow-hidden rounded-[18px] p-5 sm:p-6">
      {/* 品牌色薄雾：让玻璃卡和背景插画之间有过渡，而不是一张纯白卡片贴上去 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(124,58,237,0.1)_52%,rgba(236,72,153,0.08))] dark:bg-[linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.18)_52%,rgba(236,72,153,0.14))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.2),transparent_68%)] dark:bg-[radial-gradient(circle,rgba(167,139,250,0.26),transparent_68%)]"
      />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-sheen px-2.5 py-1 text-[12.5px] font-medium text-primary-strong backdrop-blur-sm">
          <SparklesIcon size={13} />
          欢迎来到 {SITE.name}
        </span>

        <h1 className="mt-3.5 text-[25px] leading-[1.22] font-bold tracking-tight sm:text-[29px] lg:text-[32px]">
          <span className="bg-gradient-to-r from-[#1d4ed8] via-[#6d28d9] to-[#a21caf] bg-clip-text text-transparent dark:from-[#93c5fd] dark:via-[#c4b5fd] dark:to-[#f0abfc]">
            {heroTitle}
          </span>
        </h1>

        <p className="mt-2.5 whitespace-pre-line text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
          {heroDescription}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6 sm:gap-3">
          <Link
            href="/api/random"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-[14.5px] font-medium text-white shadow-[0_12px_26px_-14px_rgba(37,99,235,0.95)] transition-colors hover:bg-primary-strong"
          >
            <GamepadIcon size={17} />
            随机一部游戏
          </Link>
          <Link
            href="/docs/getting-started"
            aria-label="帮助文档"
            title="帮助文档"
            className="glass-card flex h-11 w-11 items-center justify-center rounded-xl text-violet transition-colors hover:text-primary-strong"
          >
            <BookIcon size={19} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  const items = [
    {
      href: "/tags",
      label: "标签",
      icon: <TagIcon size={16} />,
      tone: "bg-primary-soft text-primary-strong",
    },
    {
      href: "/discussions",
      label: "讨论",
      icon: <CommentIcon size={16} />,
      tone: "bg-violet-soft text-violet",
    },
    {
      href: "/docs",
      label: "文档",
      icon: <BookIcon size={16} />,
      tone: "bg-mint-soft text-mint",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="glass-card card-hover flex min-w-0 items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-medium text-ink-soft transition-colors hover:text-ink sm:py-3 sm:text-[14.5px]"
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
          >
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

/** 分节标题：标题与「查看更多」共用同一条玻璃条，避免文字直接压在插画上 */
function SectionBar({
  title,
  href,
  label = "查看更多",
}: {
  title: string;
  href: string;
  label?: string;
}) {
  return (
    <div className="section-bar mb-3.5 sm:mb-4">
      <h2 className="flex min-w-0 items-center gap-2 text-[17px] font-semibold tracking-tight text-ink sm:text-[19px]">
        <span
          aria-hidden
          className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary to-violet"
        />
        <span className="truncate">{title}</span>
      </h2>
      <Link
        href={href}
        className="group inline-flex h-10 shrink-0 items-center gap-0.5 rounded-lg px-2.5 text-[13px] font-medium text-muted transition-colors hover:bg-subtle hover:text-primary-strong sm:h-9 sm:text-[13.5px]"
      >
        {label}
        <ChevronRightIcon
          size={14}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  );
}

async function LatestGames() {
  // 屏蔽列表依赖当前登录用户；在读取 Cookie / 验证 JWT 前切换到请求时渲染
  await connection();
  const blocked = await getBlockedTagSlugs();
  const blockedGames = await getBlockedGameIds();
  const games = await getLatestGames(8, blocked, blockedGames);
  return <GameGrid games={games} />;
}

/** 右侧活动轮播：取最新公告/文档，没有封面时用站长设置的活动横幅图 */
async function HomeActivity() {
  const [items, settings] = await Promise.all([getActivityItems(5), getSiteSettings()]);
  return <ActivityCarousel items={items} fallbackCover={settings.bannerUrl || undefined} />;
}

/** 首页底部友情链接：内容全部来自后台「网站设置」 */
async function HomeFriends() {
  const friends = await getFriendLinks();
  if (friends.length === 0) return null;

  return (
    <section className="mt-8 sm:mt-10">
      <SectionBar title="友情链接" href="/friends" label="查看全部" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {friends.slice(0, 8).map((friend) => (
          <a
            key={friend.id}
            href={friend.url}
            target={friend.url.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="glass-card card-hover flex flex-col overflow-hidden rounded-[14px]"
          >
            <div className="aspect-[16/9] overflow-hidden bg-subtle">
              {friend.imageUrl ? (
                <img
                  src={friend.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#bfdbfe] to-[#6366f1] text-[24px] font-semibold text-white">
                  {friend.title.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="min-w-0 px-3 py-2.5 sm:px-3.5 sm:py-3">
              <h3 className="truncate text-[14px] font-semibold text-ink sm:text-[15px]">
                {friend.title}
              </h3>
              {friend.description && (
                <p className="clamp-2 mt-1 text-[12.5px] leading-relaxed text-muted sm:mt-1.5 sm:text-[13px]">
                  {friend.description}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/** 最新补丁：与「最新游戏」同样的四列布局，卡片内容换成补丁信息 */
async function LatestPatches() {
  const patches = await getLatestPatches(4);

  if (patches.length === 0) {
    return (
      <p className="glass-card rounded-[14px] border-dashed py-9 text-center text-[14px] text-muted">
        还没有补丁资源
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {patches.map((patch) => (
        <Link
          key={patch.id}
          href={`/galgame/${patch.game.slug}?tab=resources`}
          className="glass-card card-hover group overflow-hidden rounded-[14px]"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-subtle">
            {patch.game.coverUrl && (
              <img
                src={patch.game.coverUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            )}
            <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm">
              补丁
            </span>
          </div>

          <div className="px-2.5 py-2.5 sm:px-3 sm:py-3">
            <h3 className="clamp-2 text-[14px] font-semibold leading-[1.45] text-ink transition-colors group-hover:text-primary-strong sm:text-[15px]">
              {patch.title}
            </h3>
            <p className="mt-1 truncate text-[12px] text-muted sm:mt-1.5 sm:text-[13px]">
              {patch.game.title}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11.5px] text-faint sm:text-[12.5px]">
              {patch.format && (
                <span className="rounded-md bg-violet-soft px-1.5 py-0.5 text-violet">
                  {patch.format}
                </span>
              )}
              <TimeAgo value={patch.createdAt} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PatchSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="glass-card overflow-hidden rounded-[14px]">
          <div className="aspect-[16/10] bg-subtle" />
          <div className="space-y-2 px-3 py-3">
            <div className="h-3.5 w-4/5 rounded bg-subtle" />
            <div className="h-3 w-1/2 rounded bg-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}
