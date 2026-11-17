import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";

import { deleteGamesAction } from "@/app/admin/game-actions";
import { BulkToolbar } from "@/components/admin/bulk-select";
import { ListFilters } from "@/components/admin/list-filters";
import { AdminTable, Td, Th } from "@/components/admin/admin-placeholder";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "游戏管理", robots: { index: false } };

export default function AdminGamesPage({ searchParams }: PageProps<"/admin/games">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subtle" />}>
      <GamesTable searchParams={searchParams} />
    </Suspense>
  );
}

const SORTS = {
  updated: { label: "资源更新（新→旧）", order: { resourceUpdatedAt: "desc" as const } },
  created: { label: "创建时间（新→旧）", order: { createdAt: "desc" as const } },
  rating: { label: "评分最高", order: { rating: "desc" as const } },
  views: { label: "浏览最多", order: { viewCount: "desc" as const } },
  title: { label: "标题 A→Z", order: { title: "asc" as const } },
};

async function GamesTable({ searchParams }: { searchParams: PageProps<"/admin/games">["searchParams"] }) {
  await connection();
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const read = (key: string) => {
    const value = Array.isArray(params[key]) ? params[key][0] : params[key];
    return typeof value === "string" ? value : "";
  };

  const query = read("q").trim();
  const rawSort = read("sort");
  const sortKey = (rawSort in SORTS ? rawSort : "updated") as keyof typeof SORTS;

  const games = await db.game.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { originalTitle: { contains: query, mode: "insensitive" } },
            { company: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: SORTS[sortKey].order,
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      rating: true,
      viewCount: true,
      platforms: true,
      resourceUpdatedAt: true,
      company: { select: { name: true } },
      _count: { select: { resources: true, comments: true } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight text-ink">游戏管理</h1>
          <p className="mt-1.5 text-[14px] text-muted">
            共 {games.length} 个条目，按资源更新时间排序。
          </p>
        </div>
        <Link
          href="/admin/games/new"
          className="rounded-xl bg-primary px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
        >
          新建条目
        </Link>
      </div>

      <ListFilters
        basePath="/admin/games"
        query={query}
        sortKey={sortKey}
        sorts={Object.fromEntries(Object.entries(SORTS).map(([key, item]) => [key, item.label]))}
        placeholder="搜索标题 / 原名 / 会社"
        total={games.length}
      />

      <form action={deleteGamesAction} className="mt-3">
        <BulkToolbar noun="游戏" />

        <AdminTable
          head={
            <>
              <Th>选择</Th>
              <Th>条目</Th>
              <Th>会社</Th>
              <Th>平台</Th>
              <Th>评分</Th>
              <Th>浏览</Th>
              <Th>资源 / 评论</Th>
              <Th>资源更新</Th>
              <Th>操作</Th>
            </>
          }
          empty={games.length === 0}
        >
          {games.map((game) => (
            <tr key={game.id}>
              <Td>
                <input
                  type="checkbox"
                  name="ids"
                  value={game.id}
                  aria-label={`选择 ${game.title}`}
                  className="h-3.5 w-3.5 accent-primary"
                />
              </Td>
              <Td>
                <a href={`/galgame/${game.slug}`} className="font-medium text-primary-strong hover:underline">
                  {game.title}
                </a>
              </Td>
              <Td>{game.company?.name ?? "—"}</Td>
              <Td>{game.platforms.join(" / ")}</Td>
              <Td>{game.rating.toFixed(1)}</Td>
              <Td>{game.viewCount.toLocaleString("zh-CN")}</Td>
              <Td>
                {game._count.resources} / {game._count.comments}
              </Td>
              <Td>{formatDate(game.resourceUpdatedAt)}</Td>
              <Td>
                <Link
                  href={`/admin/games/${game.id}`}
                  className="rounded-lg border border-line px-2.5 py-1 text-[13px] text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong"
                >
                  编辑
                </Link>
              </Td>
            </tr>
          ))}
        </AdminTable>
      </form>
    </div>
  );
}
