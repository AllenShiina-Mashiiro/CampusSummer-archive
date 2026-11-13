import Link from "next/link";

export default function NotFound() {
  return (
    <section className="subpage not-found">
      <p className="section-kicker">404 / LOST IN SUMMER</p>
      <h1>这页暂时不在地图上。</h1>
      <p className="subpage-lead">也许它还没有被收录，或者地址已经改变。</p>
      <Link className="button-primary" href="/">回到首页 ↗</Link>
    </section>
  );
}
