import Link from "next/link";
import { ArrowRight, Building2, Tags, BookOpen, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { GameCard } from "@/components/game-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [games, gameCount, companyRows, tagRows] = await Promise.all([
    prisma.game.findMany({ where: { status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, take: 6 }),
    prisma.game.count({ where: { status: "PUBLISHED" } }),
    prisma.game.findMany({ where: { status: "PUBLISHED" }, select: { developer: true, publisher: true } }),
    prisma.game.findMany({ where: { status: "PUBLISHED" }, select: { tags: true } }),
  ]);
  const companyCount = new Set(companyRows.flatMap((row) => [row.developer, row.publisher]).filter((name): name is string => Boolean(name))).size;
  const tagCount = new Set(tagRows.flatMap((row) => row.tags)).size;

  return (
    <>
      <section className="home-hero">
        <div className="hero-inner">
          <p className="eyebrow">VISUAL NOVEL & GAME DATABASE</p>
          <h1>发现作品，<span>整理热爱。</span></h1>
          <p className="hero-copy">以作品为核心，收录游戏信息、制作会社与标签索引。<br className="desktop-only" />建立清晰、易查阅、持续更新的游戏档案。</p>
          <form action="/games" className="hero-search">
            <Search size={19} />
            <input name="q" placeholder="搜索游戏名称、会社或关键词…" aria-label="搜索游戏" />
            <button type="submit">搜索作品</button>
          </form>
          <div className="hero-shortcuts"><Link href="/games">浏览全部作品 <ArrowRight size={15} /></Link><Link href="/companies">按会社查找 <ArrowRight size={15} /></Link></div>
        </div>
        <div className="hero-index"><span>DATABASE</span><strong>01</strong><span>CATALOGUE</span></div>
      </section>

      <section className="stats-strip">
        <div><strong>{gameCount.toLocaleString("zh-CN")}</strong><span>收录作品</span></div>
        <div><strong>{companyCount.toLocaleString("zh-CN")}</strong><span>游戏会社</span></div>
        <div><strong>{tagCount.toLocaleString("zh-CN")}</strong><span>作品标签</span></div>
        <div className="stats-note">持续整理 · 持续更新</div>
      </section>

      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">LATEST ENTRIES</p><h2>最近收录</h2><p>近期加入档案库的作品</p></div><Link className="text-link" href="/games">查看全部 <ArrowRight size={16} /></Link></div>
        {games.length ? <div className="game-grid">{games.map((game) => <GameCard key={game.id} game={game} />)}</div> : <div className="empty-state"><BookOpen size={28} /><h3>档案库正在建立中</h3><p>目前还没有公开的作品条目。完成数据录入后，作品会显示在这里。</p><Link href="/docs">查看资料录入说明 <ArrowRight size={15} /></Link></div>}
      </section>

      <section className="directory-section">
        <div className="directory-card"><Building2 size={25} /><div><h3>游戏会社</h3><p>按制作会社与发行会社浏览作品。</p><Link href="/companies">浏览会社索引 <ArrowRight size={15} /></Link></div></div>
        <div className="directory-card"><Tags size={25} /><div><h3>游戏标签</h3><p>通过题材、类型与关键词发现作品。</p><Link href="/tags">浏览标签索引 <ArrowRight size={15} /></Link></div></div>
      </section>
    </>
  );
}
