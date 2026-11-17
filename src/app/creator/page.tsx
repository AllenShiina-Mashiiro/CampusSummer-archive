import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import { PlusIcon } from "@/components/icons";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = {
  title: "创作中心",
  robots: { index: false },
};

export default function CreatorPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "创作中心" }]} />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-semibold tracking-tight text-ink">创作中心</h1>
          <p className="mt-1.5 text-[14px] text-muted">
            发布游戏、维护自己条目的资源链接与截图。
          </p>
        </div>
        <Link
          href="/creator/games/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
        >
          <PlusIcon size={15} />
          发布游戏
        </Link>
      </div>

      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <OwnGames />
      </Suspense>
    </div>
  );
}

async function OwnGames() {
  await connection();
  const user = await requireCapability("creator.center");

  // 条目由全体创作者协作维护：这里列出全部条目，自己发布的排在最前
  const games = await db.game.findMany({
    orderBy: [{ creatorId: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      rating: true,
      viewCount: true,
      resourceUpdatedAt: true,
      _count: { select: { resources: true, comments: true } },
    },
  });

  if (games.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <p className="text-[14.5px] text-ink-soft">你还没有发布过游戏</p>
        <p className="mt-1 text-[13.5px] text-muted">点右上角「发布游戏」开始整理第一个条目。</p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-[14px]">
        <thead className="bg-subtle text-[13px] text-muted">
          <tr>
            <th className="px-5 py-3 font-medium">游戏</th>
            <th className="px-5 py-3 font-medium">评分</th>
            <th className="px-5 py-3 font-medium">浏览</th>
            <th className="px-5 py-3 font-medium">资源 / 讨论</th>
            <th className="px-5 py-3 font-medium">最近更新</th>
            <th className="px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {games.map((game) => (
            <tr key={game.id}>
              <td className="px-5 py-3">
                <Link href={`/galgame/${game.slug}`} className="font-medium text-primary-strong hover:underline">
                  {game.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-ink-soft">{game.rating.toFixed(1)}</td>
              <td className="px-5 py-3 text-ink-soft">{game.viewCount.toLocaleString("zh-CN")}</td>
              <td className="px-5 py-3 text-ink-soft">
                {game._count.resources} / {game._count.comments}
              </td>
              <td className="px-5 py-3 text-ink-soft">{formatDate(game.resourceUpdatedAt)}</td>
              <td className="px-5 py-3">
                <Link
                  href={`/creator/games/${game.id}`}
                  className="rounded-lg border border-line px-2.5 py-1 text-[13px] text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong"
                >
                  编辑
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
