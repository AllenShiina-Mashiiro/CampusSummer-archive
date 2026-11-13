import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GameCard } from "@/components/game-card";

export const metadata: Metadata = { title: "游戏档案" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; tag?: string; company?: string }> };

export default async function GamesPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const tag = params.tag?.trim() || "";
  const company = params.company?.trim() || "";
  const conditions: Prisma.GameWhereInput[] = [
    ...(q ? [{ OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }, { developer: { contains: q, mode: "insensitive" } }, { publisher: { contains: q, mode: "insensitive" } }] }] : []),
    ...(company ? [{ OR: [{ developer: { contains: company, mode: "insensitive" } }, { publisher: { contains: company, mode: "insensitive" } }] }] : []),
    ...(tag ? [{ tags: { has: tag } }] : []),
  ];
  const where: Prisma.GameWhereInput = { status: "PUBLISHED", ...(conditions.length ? { AND: conditions } : {}) };
  const [games, count] = await Promise.all([
    prisma.game.findMany({ where, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: 48 }),
    prisma.game.count({ where }),
  ]);

  return (
    <section className="page-content">
      <div className="page-title-row"><div><p className="page-kicker">DATABASE / GAME INDEX</p><h1>游戏档案</h1><p className="page-lead">浏览已收录的游戏作品，按名称、会社与标签查找。</p></div><span className="result-count">共收录 {count} 部作品</span></div>
      <form className="filter-bar" action="/games">
        <input name="q" defaultValue={q} placeholder="搜索游戏名称、简介或会社…" aria-label="搜索游戏" />
        {tag && <input type="hidden" name="tag" value={tag} />}
        {company && <input type="hidden" name="company" value={company} />}
        <button type="submit">搜索</button>
      </form>
      {(tag || company) && <p className="result-count">当前筛选：{[company, tag].filter(Boolean).join(" / ")}　<a href="/games">清除筛选</a></p>}
      {games.length ? <div className="game-grid">{games.map((game) => <GameCard key={game.id} game={game} />)}</div> : <div className="empty-state"><strong>没有找到匹配的游戏</strong><p>可以尝试更换关键词，或稍后再来查看新增档案。</p></div>}
    </section>
  );
}
