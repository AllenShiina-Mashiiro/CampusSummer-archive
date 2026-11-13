import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div><p className="footer-brand">CampusSummer <span>Archive</span></p><p className="footer-note">把那些闪闪发光的夏日，认真收藏起来。</p></div>
        <div className="footer-links"><Link href="/games">游戏档案</Link><Link href="/articles">文化手记</Link><Link href="/about">关于项目</Link></div>
        <p className="copyright">© {new Date().getFullYear()} CampusSummer Archive</p>
      </div>
    </footer>
  );
}
