import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import { BookIcon } from "@/components/icons";
import { DocTree } from "@/components/doc-tree";
import { DocToc } from "@/components/doc-toc";
import { Markdown } from "@/components/markdown";
import { DOC_CATEGORY_LABEL, getDocBySlug, getDocTree } from "@/lib/docs";
import { formatDate } from "@/lib/site";
import { extractHeadings } from "@/lib/toc";

export async function generateMetadata(props: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = await getDocBySlug(slug);
  if (!doc) notFound();

  return {
    title: doc.title,
    description: doc.summary ?? undefined,
  };
}

export default function DocDetailPage(props: PageProps<"/docs/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Suspense
        fallback={
          <div className="animate-pulse">
            <div className="h-3 w-40 rounded bg-subtle" />
            <div className="mt-4 h-8 w-64 rounded bg-subtle" />
          </div>
        }
      >
        <DocDetail params={props.params} />
      </Suspense>
    </div>
  );
}

async function DocDetail({ params }: { params: PageProps<"/docs/[slug]">["params"] }) {
  const { slug } = await params;
  const [doc, tree] = await Promise.all([getDocBySlug(slug), getDocTree()]);
  if (!doc) notFound();

  const headings = extractHeadings(doc.content);

  return (
    <>
      <Breadcrumb items={[{ href: "/docs", label: "帮助文档" }, { label: doc.title }]} />

      <div className="mt-4 grid gap-5 lg:grid-cols-[260px_1fr_220px]">
        <aside className="h-fit rounded-xl border border-line bg-surface p-3">
          <Link
            href="/docs"
            className="flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-[14.5px] font-medium text-primary-strong"
          >
            <BookIcon size={16} />
            帮助文档
          </Link>

          <DocTree
            groups={tree.map((group) => ({ label: group.label, docs: group.docs }))}
            activeSlug={doc.slug}
          />
        </aside>

        <div className="space-y-4">
          {/* 头图：大图打底，标题/摘要/元信息压在图上 */}
          <header className="relative flex h-[300px] flex-col justify-end overflow-hidden rounded-2xl">
            {doc.coverUrl ? (
              <img src={doc.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#dbeafe] via-[#ede9fe] to-[#fce7f3] dark:from-[#1a2233] dark:via-[#221b33] dark:to-[#2a1b2b]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/5" />

            <div className="relative px-6 pb-6 lg:px-8">
              <span className="rounded-md bg-white/25 px-2 py-0.5 text-[12.5px] font-medium text-white backdrop-blur">
                {DOC_CATEGORY_LABEL[doc.category]}
              </span>
              <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-white drop-shadow-sm">
                {doc.title}
              </h1>
              {doc.summary && (
                <p className="mt-2.5 max-w-3xl text-[14.5px] leading-relaxed text-white/85">
                  {doc.summary}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-white/75">
                <span>{formatDate(doc.updatedAt)}</span>
                <span>{doc.wordCount} 字</span>
              </div>
            </div>
          </header>

          {/* 作者行：独立卡片 */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[14px] font-semibold text-white">
                {doc.author?.avatarUrl ? (
                  <img src={doc.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (doc.author?.displayName ?? "档").slice(0, 1)
                )}
              </span>
              <div>
                <p className="text-[12.5px] text-faint">作者</p>
                {doc.author?.username ? (
                  <Link
                    href={`/user/${doc.author.username}`}
                    className="text-[14.5px] font-medium text-ink hover:text-primary-strong hover:underline"
                  >
                    {doc.author.displayName}
                  </Link>
                ) : (
                  <p className="text-[14.5px] font-medium text-ink">
                    {doc.author?.displayName ?? "档案组"}
                  </p>
                )}
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-soft px-2.5 py-1 text-[13px] font-medium text-violet">
              {formatDate(doc.updatedAt)}
            </span>
          </div>

          <article className="rounded-2xl border border-line bg-surface px-6 py-7 lg:px-8">
            <Markdown content={doc.content} />
          </article>
        </div>

        {/* 本页面索引：解析正文二/三级标题，滚动时高亮 */}
        <aside className="hidden h-fit lg:block">
          <DocToc headings={headings} />
        </aside>
      </div>
    </>
  );
}
