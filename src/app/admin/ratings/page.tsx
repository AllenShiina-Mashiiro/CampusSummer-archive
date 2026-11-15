import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminTable, Td, Th } from "@/components/admin/admin-placeholder";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "评价管理", robots: { index: false } };

export default function AdminRatingsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subtle" />}>
      <RatingsTable />
    </Suspense>
  );
}

async function RatingsTable() {
  await requireAdmin();

  const ratings = await db.rating.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      score: true,
      createdAt: true,
      user: { select: { displayName: true } },
      game: { select: { slug: true, title: true, rating: true } },
    },
  });

  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">评价管理</h1>
      <p className="mt-1.5 text-[14px] text-muted">共 {ratings.length} 条评分记录。</p>

      <div className="mt-5">
        <AdminTable
          head={
            <>
              <Th>条目</Th>
              <Th>用户</Th>
              <Th>评分</Th>
              <Th>条目均分</Th>
              <Th>时间</Th>
            </>
          }
          empty={ratings.length === 0}
        >
          {ratings.map((rating) => (
            <tr key={rating.id}>
              <Td>
                <a href={`/galgame/${rating.game.slug}`} className="hover:underline">
                  {rating.game.title}
                </a>
              </Td>
              <Td>{rating.user.displayName}</Td>
              <Td>{rating.score.toFixed(1)}</Td>
              <Td>{rating.game.rating.toFixed(1)}</Td>
              <Td>{formatDate(rating.createdAt)}</Td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
