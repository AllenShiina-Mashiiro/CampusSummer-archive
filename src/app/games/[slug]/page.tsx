import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await prisma.game.findFirst({ where: { slug, status: "PUBLISHED" }, select: { title: true, summary: true } });
  return game ? { title: game.title, description: game.summary } : { title: "作品不存在" };
}

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = await prisma.game.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!game) notFound();

  const facts = [
    ["制作会社", game.developer], ["发行会社", game.publisher],
    ["发行日期", game.releaseDate ? game.releaseDate.toLocaleDateString("zh-CN") : null],
    ["游戏平台", game.platforms.length ? game.platforms.join(" / ") : null],
  ];
  return <section className="page-shell">
    <p className="eyebrow"><Link href="/games">游戏档案</Link> / TITLE DETAIL</p>
    <div className="detail-layout">
      <div className="detail-cover">{game.coverUrl ? <img src={game.coverUrl} alt={`${game.title} 封面`} /> : <span className="cover-placeholder">CAMPUS ARCHIVE</span>}</div>
      <div className="detail-content"><h1>{game.title}</h1>{game.subtitle ? <p className="detail-subtitle">{game.subtitle}</p> : null}
        <p className="detail-description">{game.summary}</p>
        <div className="detail-facts">{facts.map(([label, value]) => <div className="detail-fact" key={label}><span>{label}</span><strong>{value || "暂无资料"}</strong></div>)}</div>
        {game.tags.length ? <div className="game-tags">{game.tags.map((tag) => <Link className="tag-pill" href={`/games?tag=${encodeURIComponent(tag)}`} key={tag}>{tag}</Link>)}</div> : null}
      </div>
    </div>
    {game.description ? <div className="prose-panel" style={{ marginTop: 38 }}><h2>作品介绍</h2><p>{game.description}</p></div> : null}
  </section>;
}
