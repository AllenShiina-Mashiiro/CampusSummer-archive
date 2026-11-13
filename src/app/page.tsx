import Link from "next/link";
import { ArrowRight, Building2, Gamepad2, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { GameCard } from "@/components/game-card";

export const dynamic = "force-dynamic";

async function getLatestGames() {
  try {
    return await prisma.game.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 12,
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const games = await getLatestGames();
  return (
    <div className="page-shell">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> GAME DATABASE & ARCHIVE</p>
          <h1>探索游戏作品，<br /><span>从档案开始。</span></h1>
          <p className="hero-description">整理游戏作品、制作会社与分类标签，建立清晰、易查阅的游戏资料索引。</p>
          <form className="hero-search" action="/games">
            <input name="q" placeholder="搜索游戏名称、别名或关键词…" aria-label="搜索游戏" />
            <button type="submit">搜索档案 <ArrowRight size={16} /></button>
          </form>
          <div className="hero-shortcuts">
            <Link href="/companies"><Building2 size={15} /> 浏览游戏会社</Link>
            <Link href="/tags"><Tags size={15} /> 按标签查找</Link>
          </div>
        </div>
        <div className="hero-aside">
          <div className="aside-icon"><Gamepad2 size={34} strokeWidth={1.4} /></div>
          <span className="aside-label">CAMPUSSUMMER ARCHIVE</span>
          <strong>GAME<br />INDEX</strong>
          <p>作品资料 · 公司索引 · 标签分类</p>
          <span className="aside-number">01 — 05</span>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div><p className="eyebrow">DATABASE / RECENTLY ADDED</p><h2>最新收录</h2><p className="section-desc">最近加入档案库的游戏作品</p></div>
          <Link className="text-link" href="/games">查看全部游戏 <ArrowRight size={16} /></Link>
        </div>
        {games.length ? <div className="game-grid">{games.map((game) => <GameCard key={game.id} game={game} />)}</div> : (
          <div className="empty-state"><Gamepad2 size={28} /><strong>游戏档案正在建立中</strong><p>数据库已连接后，可以从 Prisma Seed 导入首批作品资料。</p><Link href="/docs">查看数据录入说明 <ArrowRight size={15} /></Link></div>
        )}
      </section>

      <section className="directory-strip">
        <Link href="/companies"><Building2 size={23} /><span><strong>游戏会社</strong><small>按制作会社与发行商浏览</small></span><ArrowRight size={18} /></Link>
        <Link href="/tags"><Tags size={23} /><span><strong>游戏标签</strong><small>按题材、类型与属性筛选</small></span><ArrowRight size={18} /></Link>
        <Link href="/docs"><Gamepad2 size={23} /><span><strong>说明文档</strong><small>了解档案字段与收录规范</small></span><ArrowRight size={18} /></Link>
      </section>
    </div>
  );
}
