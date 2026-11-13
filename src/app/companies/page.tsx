import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "游戏会社" };
export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const games = await prisma.game.findMany({ where: { status: "PUBLISHED" }, select: { developer: true, publisher: true } });
  const companies = new Map<string, { developer: number; publisher: number }>();
  for (const game of games) {
    if (game.developer) {
      const item = companies.get(game.developer) ?? { developer: 0, publisher: 0 };
      item.developer += 1; companies.set(game.developer, item);
    }
    if (game.publisher) {
      const item = companies.get(game.publisher) ?? { developer: 0, publisher: 0 };
      item.publisher += 1; companies.set(game.publisher, item);
    }
  }
  const entries = [...companies.entries()].sort((a, b) => a[0].localeCompare(b[0], "zh-CN"));
  return <section className="page-shell"><div className="page-heading"><p className="eyebrow">COMPANY DIRECTORY</p><h1>游戏会社</h1><p>根据已收录作品自动整理制作会社与发行会社索引。</p></div>
    <div className="results-meta">共收录 <strong>{entries.length}</strong> 家会社</div>
    {entries.length ? <div className="index-list">{entries.map(([name, counts]) => <Link className="index-item" href={`/games?q=${encodeURIComponent(name)}`} key={name}><strong>{name}</strong><span>{counts.developer + counts.publisher} 部相关作品 →</span></Link>)}</div> : <div className="empty-state"><h3>会社索引暂时为空</h3><p>当游戏档案中补充制作会社或发行会社后，这里会自动生成索引。</p><Link href="/docs">查看资料录入说明</Link></div>}
  </section>;
}
