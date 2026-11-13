import type { Metadata } from "next";
export const metadata: Metadata = { title: "说明文档" };
export default function DocsPage() {
  return <section className="page-content"><div className="page-title-row"><div><p className="page-kicker">DOCUMENTATION / GUIDE</p><h1>说明文档</h1><p className="page-lead">了解档案结构、字段含义与内容收录方式。</p></div></div>
    <article className="doc-panel"><h2>关于游戏档案</h2><p>每条游戏档案以唯一标识 slug 作为访问地址，并记录作品名称、简介、封面、发行日期、制作会社、发行商、平台和标签。只有状态为“已发布”的条目会公开展示。</p>
    <h2>档案字段</h2><ul><li><strong>作品名称：</strong>游戏的主要显示名称。</li><li><strong>制作会社 / 发行商：</strong>用于会社索引与作品筛选。</li><li><strong>平台：</strong>作品支持的平台列表。</li><li><strong>标签：</strong>用于题材、类型和内容属性检索。</li><li><strong>封面：</strong>可填写公开图片地址；后续可接入 S3 对象存储。</li></ul>
    <h2>内容状态</h2><p>Draft（草稿）不会出现在公开列表；Published（已发布）会对外展示；Archived（已归档）保留在数据库中但不公开显示。</p>
    </article></section>;
}
