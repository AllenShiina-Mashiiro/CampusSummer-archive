import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Breadcrumb, PageHeading } from "@/components/breadcrumb";
import { GameGrid, GameGridSkeleton } from "@/components/game-card";
import { getBlockedTagSlugs } from "@/lib/blocked-tags";
import { listGames } from "@/lib/games";

export const metadata: Metadata = {
  title: "讨论",
  description: "选择一部游戏，进入它的讨论版参与讨论。",
};

export default function DiscussionsPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "讨论" }]} />

      <div className="mt-4">
        <PageHeading
          title="讨论"
          description="选择一个游戏，进入它的讨论版与其它玩家交流。"
        />
      </div>

      <Suspense fallback={<div className="mt-6"><GameGridSkeleton count={8} /></div>}>
        <DiscussionGrid />
      </Suspense>
    </div>
  );
}

async function DiscussionGrid() {
  await connection();
  const blocked = await getBlockedTagSlugs();
  const list = await listGames({ take: 24, excludeTags: blocked });

  if (list.games.length === 0) {
    return <p className="py-16 text-center text-[14.5px] text-muted">还没有可讨论的游戏。</p>;
  }

  return (
    <div className="mt-6">
      <GameGrid
        games={list.games}
        hrefFor={(game) => `/galgame/${game.slug}?tab=comments`}
      />
    </div>
  );
}
