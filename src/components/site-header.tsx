"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Library } from "lucide-react";

const links = [
  { href: "/games", label: "游戏档案" },
  { href: "/companies", label: "游戏会社" },
  { href: "/tags", label: "游戏标签" },
  { href: "/docs", label: "说明文档" },
  { href: "/about", label: "关于我们" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="Campus Archive 首页">
          <span className="brand-mark"><Library size={21} /></span>
          <span className="brand-copy"><strong>Campus Archive</strong><small>VISUAL NOVEL DATABASE</small></span>
        </Link>
        <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="主导航">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
        </nav>
        <Link className="nav-submit" href="/games">浏览作品 <span>↗</span></Link>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? "关闭菜单" : "打开菜单"}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
