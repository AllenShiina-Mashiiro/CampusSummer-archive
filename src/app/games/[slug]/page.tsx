import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await prisma.game.findFirst({ where: { slug, status: "PUBLISHED" }, select: { title: true } });
  return { title: game?.title ?? "游戏档案" };
}

export const dynamic = "force-dynamic";

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = await prisma.game.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!game) notFound();

  return (
    <section className="page-content">
      <p className="page-kicker">GAME DATABASE / DETAIL</p>
      <div className="detail-panel">
        <div className="detail-cover">{game.coverUrl ? <img src={game.coverUrl} alt="" /> : game.title.slice(0, 1)}</div>
        <div className="detail-copy">
          <p className="page-kicker">作品档案</p><h1>{game.title}</h1>
          {game.subtitle && <p>{game.subtitle}</p>}
          <p>{game.description || game.summary}</p>
          <div className="detail-fields">
            <div><small>制作会社</small><strong>{game.developer || "暂未收录"}</strong></div>
            <div><small>发行商</small><strong>{game.publisher || "暂未收录"}</strong></div>
            <div><small>发行日期</small><strong>{game.releaseDate ? game.releaseDate.toLocaleDateString("zh-CN") : "暂未收录"}</strong></div>
            <div><small>平台</small><strong>{game.platforms.join(" / ") || "暂未收录"}</strong></div>
          </div>
          {game.tags.length > 0 && <div className="tag-row">{game.tags.map((tag) => <a className="tag-chip" href={`/games?tag=${encodeURIComponent(tag)}`} key={tag}>{tag}</a>)}</div>}
        </div>
      </div>
    </section>
  );
}
