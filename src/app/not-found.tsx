import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-content">
      <p className="page-kicker">404 / PAGE NOT FOUND</p>
      <h1>没有找到这个页面</h1>
      <p className="page-lead">该地址可能已变更，或对应的档案尚未公开。</p>
      <Link className="text-link" href="/">返回首页 ↗</Link>
    </section>
  );
}
