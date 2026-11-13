import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "资料收藏" };
export default function ArchivePage() {
  return <section className="subpage"><p className="section-kicker">ARCHIVE ROOM ✳</p><h1>资料收藏</h1><p className="subpage-lead">把有价值的资料妥善收好，让后来的人也能找到。</p><div className="empty-panel"><span>REFERENCE / 001</span><h2>收藏架即将开放。</h2><p>资料索引、外部来源与主题分类正在规划中。</p><Link href="/">← 返回首页</Link></div></section>;
}
