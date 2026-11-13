import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "文化手记" };
export default function ArticlesPage() {
  return <section className="subpage"><p className="section-kicker">CULTURE NOTES ✳</p><h1>文化手记</h1><p className="subpage-lead">关于创作、作品与玩家文化的观察和记录。</p><div className="empty-panel"><span>EDITORIAL / 001</span><h2>下一篇手记，正在路上。</h2><p>专题文章、编辑精选与创作者故事将在内容系统接入后发布。</p><Link href="/">← 返回首页</Link></div></section>;
}
