import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { deleteDocAction } from "@/app/admin/doc-actions";
import { DocEditor } from "@/components/admin/doc-editor";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { DOC_CATEGORY_LABEL } from "@/lib/docs";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "文档与公告", robots: { index: false } };

export default function AdminDocsPage({ searchParams }: PageProps<"/admin/docs">) {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">文档与公告</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        发布或编辑文档；正文支持 Markdown，可直接上传图片插入正文。
      </p>

      <Suspense fallback={<div className="mt-5 h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <DocManager searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DocManager({ searchParams }: { searchParams: PageProps<"/admin/docs">["searchParams"] }) {
  await requireCapability("site.settings");

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : undefined;
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  const docs = await db.doc.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      content: true,
      category: true,
      coverUrl: true,
      wordCount: true,
      updatedAt: true,
    },
  });

  const editing = editId ? docs.find((doc) => doc.id === editId) : undefined;

  return (
    <>
      {error && (
        <p className="mt-4 rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose">
          标题与正文都是必填项。
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">
            {editing ? `编辑：${editing.title}` : "发布新文档"}
          </h2>
          {editing && (
            <Link href="/admin/docs" className="text-[13.5px] text-muted hover:text-ink">
              取消编辑
            </Link>
          )}
        </div>

        <DocEditor
          key={editing?.id ?? "new"}
          values={
            editing
              ? {
                  id: editing.id,
                  slug: editing.slug,
                  title: editing.title,
                  summary: editing.summary,
                  content: editing.content,
                  category: editing.category,
                  coverUrl: editing.coverUrl,
                }
              : undefined
          }
        />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-subtle text-[13px] text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">标题</th>
              <th className="px-5 py-3 font-medium">分类</th>
              <th className="px-5 py-3 font-medium">字数</th>
              <th className="px-5 py-3 font-medium">更新</th>
              <th className="px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {docs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[14px] text-muted">
                  还没有文档
                </td>
              </tr>
            )}
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td className="px-5 py-3">
                  <Link href={`/docs/${doc.slug}`} className="text-primary-strong hover:underline">
                    {doc.title}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {DOC_CATEGORY_LABEL[doc.category as keyof typeof DOC_CATEGORY_LABEL]}
                </td>
                <td className="px-5 py-3 text-ink-soft">{doc.wordCount}</td>
                <td className="px-5 py-3 text-ink-soft">{formatDate(doc.updatedAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/docs?edit=${doc.id}`}
                      className="rounded-lg border border-line px-2.5 py-1 text-[13px] text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong"
                    >
                      编辑
                    </Link>
                    <form action={deleteDocAction}>
                      <input type="hidden" name="id" value={doc.id} />
                      <ConfirmSubmitButton
                        label="删除"
                        title={`删除《${doc.title}》？`}
                        description="文档删除后前台链接会失效，此操作不可撤销。"
                      />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
