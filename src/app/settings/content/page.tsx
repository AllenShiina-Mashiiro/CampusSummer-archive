import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { blockTagAction, toggleBlockedGameAction } from "@/app/settings/actions";
import { SearchIcon, XIcon } from "@/components/icons";
import { SakuraToggle } from "@/components/sakura-layer";
import { SettingsCard } from "@/components/settings-card";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "内容控制",
  robots: { index: false },
};

export default function ContentSettingsPage({ searchParams }: PageProps<"/settings/content">) {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-subtle" />}>
      <ContentControls searchParams={searchParams} />
    </Suspense>
  );
}

async function ContentControls({
  searchParams,
}: {
  searchParams: PageProps<"/settings/content">["searchParams"];
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/settings/content");

  const params = (await searchParams) ?? {};
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";

  const [blocked, suggestions, blockedGames, gameSuggestions] = await Promise.all([
    db.blockedTag.findMany({
      where: { userId: session.id },
      select: { tag: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.tag.findMany({
      where: {
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        blockedBy: { none: { userId: session.id } },
      },
      select: { id: true, name: true, slug: true, _count: { select: { games: true } } },
      orderBy: { name: "asc" },
      take: q ? 8 : 0,
    }),
    db.$queryRaw<{ id: string; title: string; slug: string }[]>`
      SELECT g.id, g.title, g.slug FROM "BlockedGame" b
      JOIN "Game" g ON g.id = b."gameId"
      WHERE b."userId" = ${session.id}
      ORDER BY b."createdAt" DESC
    `,
    q
      ? db.game.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          select: { id: true, title: true, slug: true },
          take: 8,
          orderBy: { resourceUpdatedAt: "desc" },
        })
      : Promise.resolve([] as { id: string; title: string; slug: string }[]),
  ]);

  return (
    <div className="space-y-4">
      <SettingsCard
        title="樱花特效"
        description="全站飘落的樱花粒子，默认开启。关闭后立即生效，并在本设备记住选择。"
        footer="移动端会自动减少数量；系统开启「减少动态效果」时不会渲染。"
      >
        <div className="flex items-center justify-between gap-4 rounded-xl bg-subtle px-4 py-3">
          <div>
            <p className="text-[14.5px] text-ink">开启樱花特效</p>
            <p className="mt-0.5 text-[13px] text-muted">关闭可减少低配设备的绘制开销。</p>
          </div>
          <SakuraToggle />
        </div>
      </SettingsCard>

      <SettingsCard
        title="标签屏蔽"
        description="屏蔽某个标签后，带有该标签的游戏将不会出现在公开列表中。"
        footer="点按已屏蔽标签上的关闭按钮可取消屏蔽。"
      >
      <p className="text-[14.5px] font-medium text-ink">添加屏蔽标签</p>
      <p className="mt-1 text-[13.5px] text-muted">搜索标签名称，点按搜索结果即可加入屏蔽名单。</p>

      <form action="/settings/content" className="relative mt-3">
        <label htmlFor="tag-search" className="sr-only">
          标签名称
        </label>
        <input
          id="tag-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="输入标签名称"
          className="h-11 w-full rounded-xl bg-subtle pl-10 pr-4 text-[14.5px] text-ink outline-none placeholder:text-faint focus:ring-1 focus:ring-primary/40"
        />
        <SearchIcon
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
        />
      </form>

      {q && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.length === 0 ? (
            <p className="text-[13.5px] text-faint">没有匹配的标签。</p>
          ) : (
            suggestions.map((tag) => (
              <form key={tag.id} action={blockTagAction}>
                <input type="hidden" name="tagId" value={tag.id} />
                <input type="hidden" name="intent" value="block" />
                <button
                  type="submit"
                  className="rounded-lg bg-violet-soft px-2.5 py-1 text-[13px] font-medium text-violet transition-opacity hover:opacity-80"
                >
                  {tag.name} · {tag._count.games}
                </button>
              </form>
            ))
          )}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-line p-4">
        <p className="text-[14px] font-medium text-ink">已屏蔽标签</p>

        {blocked.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-line py-6 text-center text-[13.5px] text-muted">
            您暂时没有屏蔽任何标签。
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {blocked.map(({ tag }) => (
              <form key={tag.id} action={blockTagAction}>
                <input type="hidden" name="tagId" value={tag.id} />
                <input type="hidden" name="intent" value="unblock" />
                <button
                  type="submit"
                  className="group flex items-center gap-1.5 rounded-lg bg-subtle px-2.5 py-1 text-[13px] text-ink-soft transition-colors hover:bg-rose-soft hover:text-rose"
                >
                  {tag.name}
                  <XIcon size={12} className="text-faint group-hover:text-rose" />
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
      </SettingsCard>

      <SettingsCard
        title="游戏屏蔽"
        description="屏蔽某个条目后，它不会出现在首页、游戏列表与搜索结果里。"
        footer="在下方搜索框输入标题即可加入屏蔽；点按已屏蔽条目上的 × 可取消。"
      >
        <div>
          <p className="text-[14.5px] font-medium text-ink">添加屏蔽条目</p>
          <form action="/settings/content" className="relative mt-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="搜索游戏标题…"
              className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-faint focus:border-primary/50"
            />
          </form>

          {q && (
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
              {gameSuggestions.length === 0 && (
                <li className="px-4 py-3 text-[13.5px] text-faint">没有匹配的条目</li>
              )}
              {gameSuggestions.map((game) => (
                <li key={game.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0 truncate text-[14px] text-ink">{game.title}</span>
                  <form action={toggleBlockedGameAction}>
                    <input type="hidden" name="gameId" value={game.id} />
                    <input type="hidden" name="intent" value="block" />
                    <button
                      type="submit"
                      className="rounded-lg bg-primary px-2.5 py-1 text-[12.5px] font-medium text-white transition-colors hover:bg-primary-strong"
                    >
                      屏蔽
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-[14.5px] font-medium text-ink">
            已屏蔽条目（{blockedGames.length}）
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {blockedGames.length === 0 && (
              <p className="text-[13.5px] text-faint">还没有屏蔽任何条目</p>
            )}
            {blockedGames.map((game) => (
              <form key={game.id} action={toggleBlockedGameAction}>
                <input type="hidden" name="gameId" value={game.id} />
                <input type="hidden" name="intent" value="unblock" />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-soft px-3 py-1 text-[13px] text-rose transition-colors hover:bg-rose/15"
                >
                  {game.title}
                  <span aria-hidden>×</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
