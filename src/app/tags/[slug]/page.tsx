import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Breadcrumb, PageHeading } from "@/components/breadcrumb";
import { GameGrid } from "@/components/game-card";
import { Pagination } from "@/components/pagination";
import { getBlockedTagSlugs } from "@/lib/blocked-tags";
import { listGames } from "@/lib/games";
import { getTagBySlug } from "@/lib/taxonomy";

export async function generateMetadata(props: PageProps<"/tags/[slug]">) {
  const { slug } = await props.params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();
  return { title: `标签：${tag.name}` };
}

export default function TagDetailPage(props: PageProps<"/tags/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Suspense
        fallback={
          <div className="animate-pulse">
            <div className="h-3 w-32 rounded bg-subtle" />
            <div className="mt-4 h-8 w-48 rounded bg-subtle" />
          </div>
        }
      >
        <TagFeed params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function TagFeed({
  await connection();
  params,
  searchParams,
}: {
  params: PageProps<"/tags/[slug]">["params"];
  searchParams: PageProps<"/tags/[slug]">["searchParams"];
}) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const pageParam = Array.isArray(raw?.page) ? raw?.page[0] : raw?.page;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const list = await listGames({
    page,
    tag: tag.slug,
    // 正在浏览的标签本身被屏蔽时，列表会自然为空，不做额外拦截
    excludeTags: await getBlockedTagSlugs(),
  });

  return (
    <>
      <Breadcrumb items={[{ href: "/tags", label: "游戏标签" }, { label: tag.name }]} />

      <div className="mt-4">
        <PageHeading title={tag.name} description={`该标签下共有 ${list.total} 个条目`} />
      </div>

      <div className="mt-6">
        {list.games.length === 0 ? (
          <p className="py-16 text-center text-[14.5px] text-muted">该标签下还没有条目。</p>
        ) : (
          <GameGrid games={list.games} />
        )}
      </div>

      <Pagination
        basePath={`/tags/${tag.slug}`}
        currentPage={list.page}
        totalPages={list.totalPages}
      />
    </>
  );
}
