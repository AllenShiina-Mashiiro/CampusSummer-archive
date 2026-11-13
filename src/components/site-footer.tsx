import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div><p className="footer-brand">CampusSummer <span>Archive</span></p><p className="footer-note">一个持续整理与记录游戏作品资料的档案项目。</p></div>
        <nav className="footer-links" aria-label="页脚导航">
          <Link href="/games">游戏档案</Link><Link href="/companies">游戏会社</Link><Link href="/tags">游戏标签</Link><Link href="/docs">说明文档</Link><Link href="/about">关于我们</Link>
        </nav>
        <p className="copyright">© {new Date().getFullYear()} CampusSummer Archive</p>
      </div>
    </footer>
  );
}
