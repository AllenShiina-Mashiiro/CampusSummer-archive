import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "游戏标签" };
export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const games = await prisma.game.findMany({ where: { status: "PUBLISHED" }, select: { tags: true } });
  const counts = new Map<string, number>();
  for (const game of games) for (const tag of new Set(game.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));
  return <section className="page-shell"><div className="page-heading"><p className="eyebrow">TAG INDEX</p><h1>游戏标签</h1><p>通过题材、类型与关键词交叉浏览作品。</p></div>
    <div className="results-meta">共整理 <strong>{tags.length}</strong> 个标签</div>
    {tags.length ? <div className="index-list">{tags.map(([tag, count]) => <Link className="index-item" href={`/games?tag=${encodeURIComponent(tag)}`} key={tag}><strong>#{tag}</strong><span>{count} 部作品 →</span></Link>)}</div> : <div className="empty-state"><h3>还没有标签</h3><p>为已发布的游戏添加标签后，这里会自动汇总。</p><Link href="/games">返回游戏档案</Link></div>}
  </section>;
}
