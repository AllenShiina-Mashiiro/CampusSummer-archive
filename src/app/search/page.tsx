import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import { GameGrid, GameGridSkeleton } from "@/components/game-card";
import { SearchIcon } from "@/components/icons";
import { db } from "@/lib/db";
import { getBlockedTagSlugs } from "@/lib/blocked-tags";
import { ROLE_LABEL } from "@/lib/permissions";
import { listGames } from "@/lib/games";

export const metadata = {
  title: "搜索",
  robots: { index: false },
};

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "搜索" }]} />

      <div className="mt-4">
        <h1 className="text-[25px] font-semibold tracking-tight text-ink">搜索</h1>
        <p className="mt-1.5 text-[14px] text-muted">支持作品名、原名与罗马字检索</p>
      </div>

      <Suspense fallback={<div className="mt-5 h-11 rounded-xl bg-subtle" />}>
        <SearchBox searchParams={searchParams} />
      </Suspense>

      <Suspense
        fallback={
          <div className="mt-6">
            <GameGridSkeleton count={8} />
          </div>
        }
      >
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchBox({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const params = (await searchParams) ?? {};
  const q = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <form action="/search" className="relative mt-5">
      <label htmlFor="q" className="sr-only">
        关键词
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={q ?? ""}
        placeholder="输入关键词，回车搜索"
        className="h-11 w-full rounded-xl border border-transparent bg-subtle pl-4 pr-11 text-[14.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-primary/40 focus:bg-surface"
      />
      <button
        type="submit"
        aria-label="搜索"
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:text-ink"
      >
        <SearchIcon size={17} />
      </button>
    </form>
  );
}

async function SearchResults({
  await connection(); searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const params = (await searchParams) ?? {};
  const read = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };

  const query = read("q");
  if (!query) {
    return <p className="py-16 text-center text-[14.5px] text-muted">输入关键词开始搜索。</p>;
  }

  const list = await listGames({ query, take: 24, excludeTags: await getBlockedTagSlugs() });

  return (
    <div className="mt-6">
      <p className="mb-4 text-[14px] text-muted">
        「{query}」共找到 {list.total} 个条目
      </p>

      {list.games.length === 0 ? (
        <p className="py-10 text-center text-[14.5px] text-muted">没有匹配的条目。</p>
      ) : (
        <GameGrid games={list.games} />
      )}

      <UserResults query={query} />
    </div>
  );
}

/** 用户搜索：按昵称或用户名匹配 */
async function UserResults({ query }: { query: string }) {
  const users = await db.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { username: true, displayName: true, avatarUrl: true, role: true, points: true },
    take: 8,
    orderBy: { points: "desc" },
  });

  if (users.length === 0) return null;

  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="text-[16px] font-semibold text-ink">用户（{users.length}）</h2>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {users.map((user) => (
          <li key={user.username}>
            <Link
              href={`/user/${user.username}`}
              className="card-hover flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[14px] font-semibold text-white">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  user.displayName.slice(0, 1)
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-medium text-ink">
                  {user.displayName}
                </span>
                <span className="block truncate text-[12.5px] text-faint">
                  @{user.username} · {ROLE_LABEL[user.role as keyof typeof ROLE_LABEL] ?? "用户"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
