import Link from "next/link";
import { Gamepad2 } from "lucide-react";

const links = [
  { href: "/games", label: "游戏档案" },
  { href: "/companies", label: "游戏会社" },
  { href: "/tags", label: "游戏标签" },
  { href: "/docs", label: "说明文档" },
  { href: "/about", label: "关于我们" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="CampusSummer Archive 首页">
          <span className="brand-mark"><Gamepad2 size={21} /></span>
          <span className="brand-copy"><strong>CampusSummer Archive</strong><small>GAME DATABASE</small></span>
        </Link>
        <nav className="main-nav" aria-label="主导航">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <Link className="nav-cta" href="/games">浏览档案 <span>↗</span></Link>
      </div>
    </header>
  );
}
