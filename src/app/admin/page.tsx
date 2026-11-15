import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { DayRangeSlider } from "@/components/admin/day-range-slider";
import { AdminSection, StatCard } from "@/components/admin/stat-card";
import { getAdminRecent, getAdminTotals } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-guard";

export const metadata: Metadata = {
  title: "管理面板",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  // 统计区间依赖「当前时间」，必须声明为请求时渲染，否则预渲染会报 unstable value
  await connection();
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const rawDays = Number(Array.isArray(params.days) ? params.days[0] : params.days);
  const days = Number.isFinite(rawDays) ? Math.min(60, Math.max(1, rawDays)) : 1;

  const [totals, recent] = await Promise.all([getAdminTotals(), getAdminRecent(days)]);

  return (
    <div className="space-y-8">
      <AdminSection title="数据统计">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="用户总数" value={totals.users} />
          <StatCard label="游戏数量" value={totals.games} />
          <StatCard label="资源数量" value={totals.resources} />
          <StatCard label="补丁总数" value={totals.patches} />
          <StatCard label="评论总数" value={totals.comments} />
        </div>
      </AdminSection>

      <AdminSection title={`${days} 天内数据统计`}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="新注册用户" value={recent.newUsers} />
          <StatCard label="新活跃用户" value={recent.activeUsers} />
          <StatCard label="新收录游戏" value={recent.newGames} />
          <StatCard label="新上传 Gal资源" value={recent.newResources} />
          <StatCard label="新评论" value={recent.newComments} />
        </div>
      </AdminSection>

      <div className="pt-2">
        <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-subtle" />}>
          <DayRangeSlider />
        </Suspense>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 w-32 rounded bg-subtle" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-[112px] rounded-2xl border border-line bg-surface" />
        ))}
      </div>
      <div className="h-8 w-48 rounded bg-subtle" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-[112px] rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
