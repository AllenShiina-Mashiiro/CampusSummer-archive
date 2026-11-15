import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminTable, Td, Th } from "@/components/admin/admin-placeholder";
import { BulkToolbar } from "@/components/admin/bulk-select";
import { deleteCommentsAction } from "@/app/admin/game-actions";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "评论管理", robots: { index: false } };

export default function AdminCommentsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subtle" />}>
      <CommentsTable />
    </Suspense>
  );
}

async function CommentsTable() {
  await requireAdmin();

  const comments = await db.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      content: true,
      likeCount: true,
      createdAt: true,
      user: { select: { displayName: true } },
      game: { select: { slug: true, title: true } },
    },
  });

  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">评论管理</h1>
      <p className="mt-1.5 text-[14px] text-muted">共 {comments.length} 条评论，按时间倒序。</p>

      <form action={deleteCommentsAction} className="mt-5">
        <BulkToolbar noun="评论" />

        <AdminTable
          head={
            <>
              <Th>选择</Th>
              <Th>内容</Th>
              <Th>作者</Th>
              <Th>所属条目</Th>
              <Th>点赞</Th>
              <Th>时间</Th>
            </>
          }
          empty={comments.length === 0}
        >
          {comments.map((comment) => (
            <tr key={comment.id}>
              <Td>
                <input
                  type="checkbox"
                  name="ids"
                  value={comment.id}
                  aria-label="选择评论"
                  className="h-3.5 w-3.5 accent-primary"
                />
              </Td>
              <Td className="max-w-[420px]">{comment.content}</Td>
              <Td>{comment.user.displayName}</Td>
              <Td>
                <a href={`/galgame/${comment.game.slug}`} className="hover:underline">
                  {comment.game.title}
                </a>
              </Td>
              <Td>{comment.likeCount}</Td>
              <Td>{formatDate(comment.createdAt)}</Td>
            </tr>
          ))}
        </AdminTable>
      </form>
    </div>
  );
}
