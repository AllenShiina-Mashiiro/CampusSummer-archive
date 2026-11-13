import type { Metadata } from "next";

export const metadata: Metadata = { title: "说明文档" };

const docs = [
  ["如何查找作品", "在游戏档案页输入作品名称、制作会社、发行会社或简介关键词。也可以选择标签缩小结果范围。"],
  ["游戏资料字段", "每条作品资料可包含标题、别名、简介、封面、发行日期、制作会社、发行会社、平台与标签。"],
  ["会社索引规则", "游戏会社页面从已发布作品的制作会社与发行会社字段自动汇总，不需要重复创建公司条目。"],
  ["标签索引规则", "游戏标签页面从已发布作品的标签字段自动汇总，并按关联作品数量排序。"],
  ["图片与版权", "封面与截图应使用获得授权或允许展示的素材。站点支持后续接入 S3 兼容存储，图片地址保存在作品资料中。"],
];

export default function DocsPage() {
  return <section className="page-shell narrow-shell"><div className="page-heading"><p className="eyebrow">DOCUMENTATION</p><h1>说明文档</h1><p>本站栏目、资料字段与内容整理方式。</p></div>
    <div className="doc-list">{docs.map(([title, body], index) => <article className="doc-item" key={title}><p className="eyebrow">GUIDE / {String(index + 1).padStart(2, "0")}</p><h2>{title}</h2><p>{body}</p></article>)}</div>
  </section>;
}
