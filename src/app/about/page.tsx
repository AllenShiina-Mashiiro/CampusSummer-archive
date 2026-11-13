import type { Metadata } from "next";

export const metadata: Metadata = { title: "关于我们" };

export default function AboutPage() {
  return (
    <section className="page-shell narrow-shell">
      <div className="page-heading"><p className="eyebrow">ABOUT THIS PROJECT</p><h1>关于我们</h1><p>Campus Archive 是一个以游戏作品资料整理为核心的独立档案项目。</p></div>
      <div className="prose-panel">
        <h2>项目目标</h2>
        <p>我们希望建立一个结构清晰、便于检索、能够长期维护的游戏资料库。档案内容以作品基础信息为核心，并逐步整理游戏会社、标签、发行信息与相关说明。</p>
        <h2>资料原则</h2>
        <p>尽可能区分已确认资料与待补充内容，保留资料来源，并尊重作品及其相关素材的权利归属。封面与截图可由站点维护者后续上传或替换。</p>
        <h2>栏目</h2>
        <p>游戏档案用于查阅作品；游戏会社用于整理制作与发行团队；游戏标签用于交叉分类；说明文档记录本站的数据规范与使用方式。</p>
      </div>
    </section>
  );
}
