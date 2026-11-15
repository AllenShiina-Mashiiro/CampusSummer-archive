import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { GameForm } from "@/components/admin/game-form";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "发布游戏", robots: { index: false } };

export default function NewGamePage({ searchParams }: PageProps<"/admin/games/new">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-subtle" />}>
      <NewGame searchParams={searchParams} />
    </Suspense>
  );
}

async function NewGame({ searchParams }: { searchParams: PageProps<"/admin/games/new">["searchParams"] }) {
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : undefined;

  const companies = await db.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight text-ink">发布游戏</h1>
          <p className="mt-1.5 text-[14px] text-muted">
            填写条目元数据；资源链接可在创建后于编辑页补充。
          </p>
        </div>
        <Link
          href="/admin/games"
          className="text-[14px] text-muted transition-colors hover:text-ink"
        >
          返回列表
        </Link>
      </div>

      <div className="mt-5">
        <GameForm values={{ isSfw: true }} companies={companies} error={error} />
      </div>
    </div>
  );
}
