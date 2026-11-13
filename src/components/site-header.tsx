"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sun } from "lucide-react";

const links = [
  { href: "/games", label: "游戏档案" },
  { href: "/articles", label: "文化手记" },
  { href: "/archive", label: "资料收藏" },
  { href: "/about", label: "关于我们" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="CampusSummer Archive 首页">
          <span className="brand-mark"><Sun size={21} strokeWidth={1.8} /></span>
          <span className="brand-copy"><strong>CampusSummer</strong><small>ARCHIVE · 学园夏日局</small></span>
        </Link>
        <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="主导航">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
          <Link className="nav-cta" href="/games">开始探索 <span>↗</span></Link>
        </nav>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? "关闭菜单" : "打开菜单"}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
