import { Suspense } from "react";

import { Breadcrumb, PageHeading } from "@/components/breadcrumb";
import { FilterBar } from "@/components/filter-bar";
import { GameGrid, GameGridSkeleton } from "@/components/game-card";
import { Pagination } from "@/components/pagination";
import { getBlockedTagSlugs, getBlockedGameIds } from "@/lib/blocked-tags";
import { listGames, type GameSort } from "@/lib/games";

export const metadata = {
  title: "游戏",
  description: "按资源更新时间、评分与浏览量浏览全部条目，支持平台与语言筛选。",
};

const SORTS: GameSort[] = ["updated", "rating", "views"];

function readParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || null;
}

export default function GalgameListPage({ searchParams }: PageProps<"/galgame">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "游戏" }]} />

      <div className="mt-4">
        <PageHeading
          title="游戏"
          description="这里展示了本站所有的游戏，您可以使用多个条件的组合进行筛选"
        />
      </div>

      <Suspense fallback={<BrowserSkeleton />}>
        <GameBrowser searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function GameBrowser({ searchParams }: { searchParams: PageProps<"/galgame">["searchParams"] }) {
  const params = (await searchParams) ?? {};

  const sortParam = readParam(params.sort);
  const sort: GameSort = SORTS.includes(sortParam as GameSort) ? (sortParam as GameSort) : "updated";
  const dir = readParam(params.dir) === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number.parseInt(readParam(params.page) ?? "1", 10) || 1);

  const platform = readParam(params.platform);
  const language = readParam(params.language);

  const list = await listGames({
    page,
    sort,
    dir,
    platform,
    language,
    excludeTags: await getBlockedTagSlugs(),
        excludeIds: await getBlockedGameIds(),
  });

  return (
    <>
      <FilterBar total={list.total} />

      {list.games.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface py-20 text-center">
          <p className="text-[15px] text-muted">没有符合条件的条目，试试放宽筛选条件。</p>
        </div>
      ) : (
        <GameGrid games={list.games} />
      )}

      <Pagination
        basePath="/galgame"
        currentPage={list.page}
        totalPages={list.totalPages}
        params={{
          sort: sort === "updated" ? undefined : sort,
          dir: dir === "desc" ? undefined : dir,
          platform: platform ?? undefined,
          language: language ?? undefined,
        }}
      />
    </>
  );
}

function BrowserSkeleton() {
  return (
    <>
      <div className="my-5 h-[52px] animate-pulse rounded-xl border border-line bg-surface" />
      <GameGridSkeleton count={8} />
    </>
  );
}
