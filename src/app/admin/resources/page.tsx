import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminTable, Td, Th } from "@/components/admin/admin-placeholder";
import { BulkToolbar } from "@/components/admin/bulk-select";
import { ListFilters } from "@/components/admin/list-filters";
import { deleteResourcesAction } from "@/app/admin/game-actions";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "下载资源管理", robots: { index: false } };

export default function AdminResourcesPage({ searchParams }: PageProps<"/admin/resources">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subtle" />}>
      <ResourcesTable searchParams={searchParams} />
    </Suspense>
  );
}

const SORTS = {
  new: { label: "提交时间（新→旧）", order: { createdAt: "desc" as const } },
  old: { label: "提交时间（旧→新）", order: { createdAt: "asc" as const } },
  likes: { label: "点赞最多", order: { likeCount: "desc" as const } },
  title: { label: "标题 A→Z", order: { title: "asc" as const } },
};

async function ResourcesTable({
  searchParams,
}: {
  searchParams: PageProps<"/admin/resources">["searchParams"];
}) {
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const read = (key: string) => {
    const value = Array.isArray(params[key]) ? params[key][0] : params[key];
    return typeof value === "string" ? value : "";
  };

  const query = read("q").trim();
  const rawSort = read("sort");
  const sortKey = (rawSort in SORTS ? rawSort : "new") as keyof typeof SORTS;

  const resources = await db.resource.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { game: { title: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: SORTS[sortKey].order,
    take: 100,
    select: {
      id: true,
      title: true,
      type: true,
      provider: true,
      url: true,
      likeCount: true,
      createdAt: true,
      game: { select: { slug: true, title: true } },
      author: { select: { displayName: true } },
    },
  });

  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">下载资源管理</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        资源只存元数据与外部链接。可用上方检索定位，批量删除不会删除条目本身。
      </p>

      <ListFilters
        basePath="/admin/resources"
        query={query}
        sortKey={sortKey}
        sorts={Object.fromEntries(Object.entries(SORTS).map(([key, item]) => [key, item.label]))}
        placeholder="搜索资源标题 / 所属条目"
        total={resources.length}
      />

      <form action={deleteResourcesAction} className="mt-3">
        <input type="hidden" name="back" value="/admin/resources" />

        <BulkToolbar noun="资源" />

        <AdminTable
          head={
            <>
              <Th>选择</Th>
              <Th>资源</Th>
              <Th>所属条目</Th>
              <Th>类型</Th>
              <Th>来源</Th>
              <Th>提交者</Th>
              <Th>点赞</Th>
              <Th>时间</Th>
            </>
          }
          empty={resources.length === 0}
        >
          {resources.map((resource) => (
            <tr key={resource.id}>
              <Td>
                <input
                  type="checkbox"
                  name="ids"
                  value={resource.id}
                  aria-label={`选择 ${resource.title}`}
                  className="h-3.5 w-3.5 accent-primary"
                />
              </Td>
              <Td>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-primary-strong hover:underline"
                >
                  {resource.title}
                </a>
              </Td>
              <Td>
                <a href={`/galgame/${resource.game.slug}`} className="hover:underline">
                  {resource.game.title}
                </a>
              </Td>
              <Td>{resource.type}</Td>
              <Td>{resource.provider === "OFFICIAL" ? "官方" : "社区"}</Td>
              <Td>{resource.author?.displayName ?? "—"}</Td>
              <Td>{resource.likeCount}</Td>
              <Td>{formatDate(resource.createdAt)}</Td>
            </tr>
          ))}
        </AdminTable>
      </form>
    </div>
  );
}
