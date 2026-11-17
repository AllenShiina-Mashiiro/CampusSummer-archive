import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Breadcrumb, PageHeading } from "@/components/breadcrumb";
import { ListSearch } from "@/components/list-search";
import { listTags, type TagListItem } from "@/lib/taxonomy";
import { getBlockedTagSlugs } from "@/lib/blocked-tags";

export const metadata = {
  title: "游戏标签",
  description: "本站全部标签，按关联条目数排序，可用于横向浏览题材、平台与叙事母题。",
};

export default function TagsPage({ searchParams }: PageProps<"/tags">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "游戏标签" }]} />

      <div className="mt-4">
        <PageHeading title="标签列表" description="这里是本站游戏中的所有标签" />
      </div>

      <div className="mt-5">
        <Suspense fallback={<div className="h-11 rounded-xl bg-subtle" />}>
          <SearchArea searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense fallback={<TagGridSkeleton />}>
        <TagGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchArea({ searchParams }: { searchParams: PageProps<"/tags">["searchParams"] }) {
  const params = (await searchParams) ?? {};
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  return (
    <ListSearch
      action="/tags"
      placeholder="可以用空格分隔您的搜索关键字"
      defaultValue={q ?? ""}
    />
  );
}

async function TagGrid({ searchParams }: { searchParams: PageProps<"/tags">["searchParams"] }) {
  await connection();
  const params = (await searchParams) ?? {};
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const [all, blocked] = await Promise.all([listTags(q), getBlockedTagSlugs()]);

  // 用户屏蔽的标签不再出现在列表中
  const blockedSet = new Set(blocked);
  const tags = all.filter((tag) => !blockedSet.has(tag.slug));

  if (tags.length === 0) {
    return (
      <p className="py-16 text-center text-[14.5px] text-muted">
        没有匹配的标签，试试其他关键字。
      </p>
    );
  }

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {tags.map((tag) => (
        <TagCard key={tag.slug} tag={tag} />
      ))}
    </div>
  );
}

function TagCard({ tag }: { tag: TagListItem }) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className="card-hover flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4"
    >
      <span className="truncate text-[18px] font-bold tracking-tight text-ink">{tag.name}</span>
      <span className="shrink-0 rounded-full bg-subtle px-2.5 py-1 text-[13px] text-muted">
        {tag.count}
      </span>
    </Link>
  );
}

function TagGridSkeleton() {
  return (
    <div className="mt-5 grid animate-pulse grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="h-[52px] rounded-xl border border-line bg-surface" />
      ))}
    </div>
  );
}
