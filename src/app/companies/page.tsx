import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "游戏会社" };
export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const games = await prisma.game.findMany({ where: { status: "PUBLISHED" }, select: { developer: true, publisher: true } });
  const counts = new Map<string, number>();
  for (const game of games) for (const name of new Set([game.developer, game.publisher].filter((value): value is string => Boolean(value?.trim())))) counts.set(name, (counts.get(name) ?? 0) + 1);
  const companies = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "zh-CN"));
  return <section className="page-content"><div className="page-title-row"><div><p className="page-kicker">DATABASE / COMPANY INDEX</p><h1>游戏会社</h1><p className="page-lead">按制作会社与发行商浏览已收录作品。</p></div><span className="result-count">{companies.length} 家会社</span></div>
    {companies.length ? <div className="directory-grid">{companies.map(([name, count]) => <Link className="directory-item" href={`/games?company=${encodeURIComponent(name)}`} key={name}><span className="directory-item-icon"><Building2 size={18} /></span><span><strong>{name}</strong><small>{count} 部关联作品</small></span></Link>)}</div> : <div className="empty-state"><Building2 size={26} /><strong>会社索引暂时为空</strong><p>游戏档案录入 developer 或 publisher 后，会自动汇总显示在这里。</p></div>}
  </section>;
}
