import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import { BookIcon, ChevronRightIcon } from "@/components/icons";
import { DocTree } from "@/components/doc-tree";
import { DOC_CATEGORY_LABEL, getDocTree, listDocs, type DocListItem } from "@/lib/docs";
import { formatDate } from "@/lib/site";

export const metadata = {
  title: "帮助文档",
  description: "站点说明、条目收录规范、用户角色与隐私政策。",
};

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6 sm:py-6">
      <Breadcrumb items={[{ label: "帮助文档" }]} />

      <div className="mt-4 grid gap-5 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={<div className="h-64 rounded-xl border border-line bg-surface" />}>
          <DocSidebar />
        </Suspense>

        <Suspense fallback={<DocsSkeleton />}>
          <DocIndex />
        </Suspense>
      </div>
    </div>
  );
}

async function DocSidebar() {
  const tree = await getDocTree();

  return (
    <aside className="glass-card h-fit rounded-xl p-3">
      <Link
        href="/docs"
        className="flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-[14.5px] font-medium text-primary-strong"
      >
        <BookIcon size={16} />
        帮助文档
      </Link>

      <DocTree groups={tree.map((group) => ({ label: group.label, docs: group.docs }))} />
    </aside>
  );
}

async function DocIndex() {
  const docs = await listDocs();

  return (
    <section>
      <div className="page-head mb-4 flex items-start justify-between gap-4 sm:mb-5">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold tracking-tight text-ink sm:text-[25px]">
            全部文档
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted sm:text-[14px]">
            如果您在网站遇到任何问题，都可以来此处查看帮助文档
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-primary-soft px-2.5 py-1.5 text-[12.5px] font-medium text-primary-strong sm:px-3 sm:text-[13.5px]">
          {docs.length} 篇文档
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {docs.map((doc) => (
          <DocCard key={doc.slug} doc={doc} />
        ))}
      </div>
    </section>
  );
}

/** 文档封面用确定性的渐变色块，避免为纯文本文档额外准备图片资源 */
function coverGradient(slug: string): string {
  const palettes = [
    "from-[#a7f3d0] to-[#0f766e]",
    "from-[#bfdbfe] to-[#1d4ed8]",
    "from-[#fbcfe8] to-[#9d174d]",
    "from-[#ddd6fe] to-[#5b21b6]",
    "from-[#fde68a] to-[#b45309]",
    "from-[#fecaca] to-[#991b1b]",
  ];
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return palettes[hash % palettes.length];
}

function DocCard({ doc }: { doc: DocListItem }) {
  return (
    <Link
      href={`/docs/${doc.slug}`}
      className="glass-card card-hover group flex flex-col overflow-hidden rounded-[14px]"
    >
      <div className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${coverGradient(doc.slug)}`}>
        {doc.coverUrl && (
          <img src={doc.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_60%)]" />
        <span className="absolute left-3 top-3 rounded-md bg-white/20 px-1.5 py-0.5 text-[11.5px] font-medium text-white backdrop-blur">
          {DOC_CATEGORY_LABEL[doc.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3.5 py-3">
        <h2 className="clamp-2 text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-primary-strong">
          {doc.title}
        </h2>

        <div className="mt-2 flex items-center gap-3 text-[12.5px] text-faint">
          <span>{formatDate(doc.updatedAt)}</span>
          <span className="flex items-center gap-1">T {doc.wordCount} 字</span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-2.5 text-[13px] text-muted">
          阅读文档
          <ChevronRightIcon size={13} className="text-faint transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function DocsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-40 rounded bg-subtle" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="glass-card overflow-hidden rounded-[14px]">
            <div className="aspect-[16/9] bg-subtle" />
            <div className="space-y-2 px-3.5 py-3">
              <div className="h-3.5 w-4/5 rounded bg-subtle" />
              <div className="h-3 w-1/2 rounded bg-subtle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
