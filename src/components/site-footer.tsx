import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div><p className="footer-brand">Campus Archive</p><p className="footer-note">一个持续整理与维护的游戏作品资料库。</p></div>
        <div className="footer-links">
          <Link href="/games">游戏档案</Link><Link href="/companies">游戏会社</Link>
          <Link href="/tags">游戏标签</Link><Link href="/docs">说明文档</Link><Link href="/about">关于我们</Link>
        </div>
        <p className="copyright">© {new Date().getFullYear()} Campus Archive</p>
      </div>
    </footer>
  );
}
