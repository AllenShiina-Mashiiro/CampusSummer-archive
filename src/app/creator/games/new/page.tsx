import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { GameForm } from "@/components/admin/game-form";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "发布游戏", robots: { index: false } };

export default function CreatorNewGamePage({
  searchParams,
}: PageProps<"/creator/games/new">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-subtle" />}>
        <NewGame searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewGame({
  searchParams,
}: {
  searchParams: PageProps<"/creator/games/new">["searchParams"];
}) {
  await requireCapability("game.publish");

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : undefined;

  const companies = await db.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight text-ink">发布游戏</h1>
          <p className="mt-1.5 text-[14px] text-muted">
            填写条目元数据；保存后可在创作中心继续补充资源链接与截图。
          </p>
        </div>
        <Link href="/creator" className="text-[14px] text-muted transition-colors hover:text-ink">
          返回创作中心
        </Link>
      </div>

      <div className="mt-5">
        <GameForm values={{ isSfw: true }} companies={companies} error={error} />
      </div>
    </>
  );
}
