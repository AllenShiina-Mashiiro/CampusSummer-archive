import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { submitCreatorApplication } from "@/app/admin/creator-actions";
import { SettingsCard, fieldClass } from "@/components/settings-card";
import { requireUser } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "创作者申请", robots: { index: false } };

export default function CreatorApplyPage({ searchParams }: PageProps<"/settings/creator">) {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-subtle" />}>
      <ApplyForm searchParams={searchParams} />
    </Suspense>
  );
}

async function ApplyForm({ searchParams }: { searchParams: PageProps<"/settings/creator">["searchParams"] }) {
  const me = await requireUser();
  const params = (await searchParams) ?? {};

  const latest = await db.creatorApplication.findFirst({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true },
  });

  if (me.role === "CREATOR" || me.role === "ADMIN" || me.role === "MODERATOR" || me.role === "SUPER_ADMIN") {
    return (
      <SettingsCard title="创作者申请" description="你已经是创作者或管理员，无需再次申请。">
        <p className="text-[14px] text-muted">可以直接前往创作中心发布游戏。</p>
      </SettingsCard>
    );
  }

  if (params.ok) {
    return (
      <SettingsCard title="创作者申请" description="申请已提交，等待管理员审核。">
        <p className="rounded-xl bg-mint-soft px-4 py-3 text-[14px] text-mint">
          提交成功，审核结果会通过站内消息通知你。
        </p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      title="创作者申请"
      description="填写申请后由管理员人工核实；通过后即可在创作中心发布游戏与资源。"
      footer={
        latest
          ? `最近一次申请：${latest.status === "PENDING" ? "审核中" : latest.status === "ACCEPTED" ? "已通过" : "未通过"}（${formatDate(latest.createdAt)}）`
          : "请尽量填写可核实的作品与联系方式。"
      }
    >
      {params.error && (
        <p className="mb-3 rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose">
          {params.error === "pending" ? "你已有一条待审核的申请，请耐心等待。" : "请填写申请原因。"}
        </p>
      )}

      <form id="creator-apply" action={submitCreatorApplication} className="space-y-3">
        <textarea name="reason" rows={4} required placeholder="申请原因 *" className={`${fieldClass} resize-y`} />
        <input name="identity" placeholder="身份（学生 / 社团成员 / 独立开发者…）" className={fieldClass} />
        <input name="works" placeholder="作品或过往整理成果（链接 / 名称）" className={fieldClass} />
        <input name="contact" placeholder="联系方式（邮箱 / 其他）" className={fieldClass} />
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
        >
          提交申请
        </button>
      </form>
    </SettingsCard>
  );
}
