import type { Metadata } from "next";
export const metadata: Metadata = { title: "关于我们" };
export default function AboutPage() {
  return <section className="subpage"><p className="section-kicker">ABOUT THE PROJECT ✳</p><h1>关于学园夏日局</h1><p className="subpage-lead">一个关于游戏、青春与创作的数字档案馆。</p><div className="about-copy"><p>CampusSummer Archive 希望成为一个长期生长的游戏文化站点。我们关注视觉小说与相关游戏作品，也珍惜围绕作品产生的创作、讨论和记忆。</p><p>这里会逐步建立游戏资料库、文化专题与资料收藏空间，让喜欢这些故事的人能够发现、整理并分享值得留存的内容。</p></div></section>;
}
