import Link from "next/link";

export default function NotFound() {
  return <section className="page-shell"><div className="empty-state"><p className="eyebrow">404 / NOT FOUND</p><h3>没有找到这个页面</h3><p>页面可能已移动，或对应的作品资料尚未公开。</p><Link href="/games">返回游戏档案</Link></div></section>;
}
