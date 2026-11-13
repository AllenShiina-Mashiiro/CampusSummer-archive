import type { Metadata } from "next";
export const metadata: Metadata = { title: "关于我们" };
export default function AboutPage() {
  return <section className="page-content"><div className="page-title-row"><div><p className="page-kicker">ABOUT / PROJECT</p><h1>关于我们</h1><p className="page-lead">一个持续整理游戏作品信息的独立档案项目。</p></div></div>
    <article className="about-panel"><h2>CampusSummer Archive</h2><p>CampusSummer Archive 致力于整理游戏作品、制作会社、发行信息与分类标签，为访问者提供清晰、可检索的游戏资料索引。</p><p>本站以资料整理和文化记录为主要目的。作品名称、相关商标及素材的权利归各自权利人所有。站点将逐步完善数据校对、分类和档案维护流程。</p><p>当前站点使用 Next.js、React、PostgreSQL、Prisma、Redis、S3 兼容对象存储与 Tailwind CSS 构建。</p></article></section>;
}
