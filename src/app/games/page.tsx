import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { GameCard } from "@/components/game-card";

export const metadata: Metadata = { title: "游戏档案" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; tag?: string }> };

export default async function GamesPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const tag = params.tag?.trim() ?? "";
  const where = {
    status: "PUBLISHED" as const,
    ...(q ? { OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { developer: { contains: q, mode: "insensitive" as const } },
      { publisher: { contains: q, mode: "insensitive" as const } },
      { summary: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  };
  const [games, count, tagRows] = await Promise.all([
    prisma.game.findMany({ where, orderBy: [{ featured: "desc" }, { updatedAt: "desc" }], take: 60 }),
    prisma.game.count({ where }),
    prisma.game.findMany({ where: { status: "PUBLISHED" }, select: { tags: true } }),
  ]);
  const tags = [...new Set(tagRows.flatMap((row) => row.tags))].sort((a, b) => a.localeCompare(b, "zh-CN"));

  return (
    <section className="page-shell">
      <div className="page-heading"><p className="eyebrow">CATALOGUE / ALL TITLES</p><h1>游戏档案</h1><p>集中查阅作品信息、制作会社、发行信息与分类标签。</p></div>
      <form action="/games" className="catalog-search"><Search size={18} /><input name="q" defaultValue={q} placeholder="搜索作品名称、会社或简介…" /><button>搜索</button></form>
      <div className="filter-row"><span>标签筛选</span><Link className={!tag ? "filter-chip active" : "filter-chip"} href={q ? `/games?q=${encodeURIComponent(q)}` : "/games"}>全部</Link>{tags.slice(0, 16).map((item) => <Link key={item} className={tag === item ? "filter-chip active" : "filter-chip"} href={`/games?tag=${encodeURIComponent(item)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>{item}</Link>)}</div>
      <div className="results-meta"><strong>{count}</strong> 部作品{q ? <span> · 搜索：{q}</span> : null}{tag ? <span> · 标签：{tag}</span> : null}</div>
      {games.length ? <div className="game-grid">{games.map((game) => <GameCard key={game.id} game={game} />)}</div> : <div className="empty-state"><Search size={26} /><h3>没有找到匹配的作品</h3><p>尝试更换关键词或清除筛选条件。</p><Link href="/games">清除筛选</Link></div>}
    </section>
  );
}
