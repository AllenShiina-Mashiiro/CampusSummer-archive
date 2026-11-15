import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { deleteResourcesAction } from "@/app/admin/game-actions";
import { BulkToolbar } from "@/components/admin/bulk-select";
import { ListFilters } from "@/components/admin/list-filters";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "补丁资源管理", robots: { index: false } };

export default function AdminPatchesPage({ searchParams }: PageProps<"/admin/patches">) {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">补丁资源管理</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        与游戏本体资源分开维护；发布游戏时可直接贴补丁链接。
      </p>

      <Suspense fallback={<div className="mt-5 h-48 animate-pulse rounded-2xl bg-subtle" />}>
        <PatchList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const SORTS = {
  new: { label: "提交时间（新→旧）", order: { createdAt: "desc" as const } },
  old: { label: "提交时间（旧→新）", order: { createdAt: "asc" as const } },
  likes: { label: "点赞最多", order: { likeCount: "desc" as const } },
  title: { label: "标题 A→Z", order: { title: "asc" as const } },
};

async function PatchList({ searchParams }: { searchParams: PageProps<"/admin/patches">["searchParams"] }) {
  await requireCapability("resource.manage");

  const params = (await searchParams) ?? {};
  const read = (key: string) => {
    const value = Array.isArray(params[key]) ? params[key][0] : params[key];
    return typeof value === "string" ? value : "";
  };

  const query = read("q").trim();
  const rawSort = read("sort");
  const sortKey = (rawSort in SORTS ? rawSort : "new") as keyof typeof SORTS;

  const patches = await db.resource.findMany({
    where: {
      type: "PATCH",
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { game: { title: { contains: query, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy: SORTS[sortKey].order,
    take: 100,
    select: {
      id: true,
      title: true,
      url: true,
      format: true,
      likeCount: true,
      createdAt: true,
      game: { select: { id: true, slug: true, title: true } },
      author: { select: { displayName: true } },
    },
  });

  if (patches.length === 0) {
    return (
      <>
        <ListFilters
          basePath="/admin/patches"
          query={query}
          sortKey={sortKey}
          sorts={Object.fromEntries(Object.entries(SORTS).map(([key, item]) => [key, item.label]))}
          placeholder="搜索补丁标题 / 所属游戏"
          total={0}
        />

        <form action={deleteResourcesAction} className="mt-3">
          <input type="hidden" name="back" value="/admin/patches" />
          <BulkToolbar noun="补丁" />

          <p className="rounded-2xl border border-dashed border-line bg-surface py-14 text-center text-[14px] text-muted">
            {query ? `没有匹配「${query}」的补丁资源` : "还没有补丁资源，发布游戏时可顺带添加补丁链接"}
          </p>
        </form>
      </>
    );
  }

  return (
    <>
      <ListFilters
        basePath="/admin/patches"
        query={query}
        sortKey={sortKey}
        sorts={Object.fromEntries(Object.entries(SORTS).map(([key, item]) => [key, item.label]))}
        placeholder="搜索补丁标题 / 所属游戏"
        total={patches.length}
      />

      <form action={deleteResourcesAction} className="mt-3">
      <input type="hidden" name="back" value="/admin/patches" />

      <BulkToolbar noun="补丁" />

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-subtle text-[13px] text-muted">
          <tr>
            <th className="px-5 py-3 font-medium">选择</th>
            <th className="px-5 py-3 font-medium">补丁</th>
            <th className="px-5 py-3 font-medium">所属游戏</th>
            <th className="px-5 py-3 font-medium">格式</th>
            <th className="px-5 py-3 font-medium">提交者</th>
            <th className="px-5 py-3 font-medium">时间</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {patches.map((patch) => (
            <tr key={patch.id}>
              <td className="px-5 py-3">
                <input
                  type="checkbox"
                  name="ids"
                  value={patch.id}
                  aria-label={`选择 ${patch.title}`}
                  className="h-3.5 w-3.5 accent-primary"
                />
              </td>
              <td className="px-5 py-3">
                <a
                  href={patch.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-primary-strong hover:underline"
                >
                  {patch.title}
                </a>
              </td>
              <td className="px-5 py-3 text-ink-soft">
                <Link href={`/galgame/${patch.game.slug}`} className="hover:underline">
                  {patch.game.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-ink-soft">{patch.format ?? "—"}</td>
              <td className="px-5 py-3 text-ink-soft">{patch.author?.displayName ?? "—"}</td>
              <td className="px-5 py-3 text-ink-soft">{formatDate(patch.createdAt)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      </form>
    </>
  );
}
