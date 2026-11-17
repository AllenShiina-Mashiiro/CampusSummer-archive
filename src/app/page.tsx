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
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      {/* 左列：介绍卡 + 三个入口；右列：公告横幅通高，和参考站版式一致 */}
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <HeroCard title={settings.heroTitle} description={settings.heroDescription} />
          <QuickLinks />
        </div>
        <Suspense fallback={<div className="min-h-[240px] animate-pulse rounded-2xl bg-subtle" />}>
          <HomeActivity />
        </Suspense>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="rounded-md bg-canvas/40 px-2 py-0.5 text-[20px] font-semibold tracking-tight text-ink backdrop-blur-sm">
            最新游戏
          </h2>
          <Link
            href="/galgame"
            className="flex items-center gap-1 rounded-md bg-canvas/40 px-2 py-0.5 text-[14px] text-muted backdrop-blur-sm transition-colors hover:text-primary-strong"
          >
            查看更多
            <ChevronRightIcon size={14} />
          </Link>
        </div>

        <Suspense fallback={<GameGridSkeleton count={8} />}>
          <LatestGames />
        </Suspense>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="rounded-md bg-canvas/40 px-2 py-0.5 text-[20px] font-semibold tracking-tight text-ink backdrop-blur-sm">
            最新补丁
          </h2>
          <Link
            href="/galgame"
            className="flex items-center gap-1 rounded-md bg-canvas/40 px-2 py-0.5 text-[14px] text-muted backdrop-blur-sm transition-colors hover:text-primary-strong"
          >
            查看更多
            <ChevronRightIcon size={14} />
          </Link>
        </div>

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
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#eef4ff] via-[#f1f0ff] to-[#f7effd] p-6 dark:from-[#151b2a] dark:via-[#191a2e] dark:to-[#1d1830]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[13px] font-medium text-primary-strong backdrop-blur dark:bg-white/10 dark:text-primary">
        <SparklesIcon size={13} />
        欢迎来到 {SITE.name}
      </span>

      <h1 className="mt-4 text-[32px] leading-[1.25] font-bold tracking-tight">
        <span className="bg-gradient-to-r from-primary-strong via-[#6366f1] to-violet bg-clip-text text-transparent">
          {heroTitle}
        </span>
      </h1>

      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
        {heroDescription}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/api/random"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-primary-strong"
        >
          <GamepadIcon size={17} />
          随机一部游戏
        </Link>
        <Link
          href="/docs/getting-started"
          aria-label="帮助文档"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-white/80 text-violet shadow-sm transition-colors hover:bg-white dark:bg-white/10"
        >
          <BookIcon size={19} />
        </Link>
      </div>
    </section>
  );
}

function NoticeCard() {
  return (
    <section className="relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-2xl border border-line">
      <div className="absolute inset-0">
        <img src="/covers/banner.svg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
      </div>

      <div className="relative p-3.5">
        <div className="rounded-xl bg-surface/95 p-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet to-primary text-[10px] font-semibold text-white">
              T
            </span>
            <span className="text-[14px] font-medium text-ink">Tobikin</span>
          </div>

          <h2 className="mt-2 text-[17px] font-semibold text-ink">捐赠赞助和财务公开</h2>
          <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
            说明本站的非商业运营原则、独立维护的财务与服务器开销情况。
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-[13px]">
            <span className="rounded-md bg-primary-soft px-1.5 py-0.5 font-medium text-primary-strong">
              公告
            </span>
            <span className="text-faint">1 年前</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  const items = [
    { href: "/tags", label: "标签", icon: <TagIcon size={17} />, tone: "bg-[#eef4ff] text-[#2563eb]" },
    {
      href: "/discussions",
      label: "讨论",
      icon: <CommentIcon size={17} />,
      tone: "bg-[#f6efff] text-[#7c3aed]",
    },
    {
      href: "/docs",
      label: "文档",
      icon: <BookIcon size={17} />,
      tone: "bg-[#ecfdf3] text-[#15803d]",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-[14.5px] font-medium text-ink-soft transition-colors hover:border-primary/30 hover:text-primary-strong"
        >
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.tone}`}>
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
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
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="rounded-md bg-canvas/40 px-2 py-0.5 text-[20px] font-semibold tracking-tight text-ink backdrop-blur-sm">
          友情链接
        </h2>
        <Link
          href="/friends"
          className="flex items-center gap-1 rounded-md bg-canvas/40 px-2 py-0.5 text-[14px] text-muted backdrop-blur-sm transition-colors hover:text-primary-strong"
        >
          查看全部
          <ChevronRightIcon size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {friends.slice(0, 8).map((friend) => (
          <a
            key={friend.id}
            href={friend.url}
            target={friend.url.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="card-hover flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface"
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
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#bfdbfe] to-[#6366f1] text-[26px] font-semibold text-white">
                  {friend.title.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="px-3.5 py-3">
              <h3 className="truncate text-[15px] font-semibold text-ink">{friend.title}</h3>
              {friend.description && (
                <p className="clamp-2 mt-1.5 text-[13px] leading-relaxed text-muted">
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
      <p className="rounded-2xl border border-dashed border-line bg-surface py-10 text-center text-[14px] text-muted">
        还没有补丁资源
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {patches.map((patch) => (
        <Link
          key={patch.id}
          href={`/galgame/${patch.game.slug}?tab=resources`}
          className="card-hover group overflow-hidden rounded-[14px] border border-line bg-surface"
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
            <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[11.5px] font-medium text-white">
              补丁
            </span>
          </div>

          <div className="px-3 py-3">
            <h3 className="clamp-2 text-[15px] font-semibold leading-[1.45] text-ink transition-colors group-hover:text-primary-strong">
              {patch.title}
            </h3>
            <p className="mt-1.5 truncate text-[13px] text-muted">{patch.game.title}</p>
            <div className="mt-2 flex items-center gap-2 text-[12.5px] text-faint">
              {patch.format && (
                <span className="rounded-md bg-violet-soft px-1.5 py-0.5 text-violet">{patch.format}</span>
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
    <div className="grid animate-pulse grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[14px] border border-line bg-surface">
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
