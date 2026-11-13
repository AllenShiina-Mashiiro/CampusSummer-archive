import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "游戏档案" };
export default function GamesPage() {
  return <section className="subpage"><p className="section-kicker">GAME LIBRARY ✳</p><h1>游戏档案</h1><p className="subpage-lead">每一部作品，都是一段值得被认真记录的旅程。</p><div className="empty-panel"><span>COMING SOON / 001</span><h2>档案室正在整理中。</h2><p>游戏条目、作品标签与详细资料页将在接下来的开发阶段陆续开放。</p><Link href="/">← 返回首页</Link></div></section>;
}
