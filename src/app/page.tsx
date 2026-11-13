import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, BookOpen, Compass, Sparkles } from "lucide-react";

const features = [
  { number: "01", title: "游戏档案", en: "GAME LIBRARY", desc: "从作品信息到游玩印象，建立一份可以慢慢翻阅的游戏收藏。", href: "/games", icon: BookOpen },
  { number: "02", title: "文化手记", en: "CULTURE NOTES", desc: "记录视觉小说、创作者与玩家文化中的灵感和故事。", href: "/articles", icon: Sparkles },
  { number: "03", title: "资料收藏", en: "ARCHIVE ROOM", desc: "整理值得保存的访谈、设定资料与社区知识。", href: "/archive", icon: Compass },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-sun" />
        <div className="hero-grid" />
        <div className="hero-content">
          <p className="eyebrow"><span className="eyebrow-dot" /> A LITTLE PLACE FOR GAME CULTURE</p>
          <h1>把夏日的故事，<br /><span>收藏在这里。</span></h1>
          <p className="hero-description">一座关于游戏、青春与创作的数字档案馆。<br />在这里，重新发现那些值得珍藏的瞬间。</p>
          <div className="hero-actions">
            <Link className="button-primary" href="/games">探索游戏档案 <ArrowUpRight size={17} /></Link>
            <Link className="button-text" href="/about">认识学园夏日局 <ArrowDownRight size={16} /></Link>
          </div>
          <div className="hero-meta"><span>EST. 2025</span><i /> <span>AN ARCHIVE OF STORIES</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="art-cloud cloud-one" /><div className="art-cloud cloud-two" />
          <div className="art-hill hill-back" /><div className="art-hill hill-front" />
          <div className="art-caption"><span>SUMMER MEMORY / 001</span><strong>Somewhere,<br />the summer stays.</strong></div>
          <div className="art-stamp">夏<br />日<br />記<br />録</div>
        </div>
        <div className="hero-side-note">青春は、何度でも。</div>
        <div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span className="scroll-line" /></div>
      </section>

      <section className="intro-section section-wrap">
        <div className="section-kicker">WELCOME TO OUR ARCHIVE <span>✳</span></div>
        <div className="intro-grid">
          <h2>不只是游玩。<br /><em>也是一种收藏。</em></h2>
          <div className="intro-copy"><p>有些故事会在通关后继续留在心里，有些画面会让一个季节变得特别。CampusSummer Archive 希望把这些关于游戏的记忆与文化，整理成一座可以持续生长的档案馆。</p><span>一个为热爱游戏文化的人准备的小小据点。</span></div>
        </div>
      </section>

      <section className="feature-section">
        <div className="section-wrap">
          <div className="section-heading"><div><div className="section-kicker">EXPLORE THE ARCHIVE <span>✳</span></div><h2>从这里开始探索</h2></div><p>三条路径，通往同一个<br />关于游戏与故事的世界。</p></div>
          <div className="feature-grid">
            {features.map(({ number, title, en, desc, href, icon: Icon }) => (
              <Link className="feature-card" href={href} key={number}>
                <div className="feature-top"><span>{number} / 03</span><Icon size={22} strokeWidth={1.5} /></div>
                <div><p className="feature-en">{en}</p><h3>{title}</h3><p className="feature-desc">{desc}</p></div>
                <div className="feature-bottom"><span>进入栏目</span><ArrowUpRight size={18} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="quote-section"><div className="quote-mark">“</div><p>夏天不会结束，<br /><span>只要还有故事值得回味。</span></p><small>— CAMPUSSUMMER ARCHIVE</small></section>
    </>
  );
}
