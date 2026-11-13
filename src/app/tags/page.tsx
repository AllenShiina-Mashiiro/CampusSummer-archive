import type { Metadata } from "next";
import Link from "next/link";
import { Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "游戏标签" };
export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const games = await prisma.game.findMany({ where: { status: "PUBLISHED" }, select: { tags: true } });
  const counts = new Map<string, number>();
  for (const game of games) for (const tag of new Set(game.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));
  return <section className="page-content"><div className="page-title-row"><div><p className="page-kicker">DATABASE / TAG INDEX</p><h1>游戏标签</h1><p className="page-lead">通过题材、类型与作品属性探索档案。</p></div><span className="result-count">{tags.length} 个标签</span></div>
    {tags.length ? <div className="directory-grid">{tags.map(([tag, count]) => <Link className="directory-item" href={`/games?tag=${encodeURIComponent(tag)}`} key={tag}><span className="directory-item-icon"><Tags size={18} /></span><span><strong>{tag}</strong><small>{count} 部作品</small></span></Link>)}</div> : <div className="empty-state"><Tags size={26} /><strong>标签列表暂时为空</strong><p>为游戏档案添加 tags 后，这里会自动生成标签索引。</p></div>}
  </section>;
}
