import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * 管理面板里尚未实现功能的模块统一走这个动态段。
 * 侧边栏的入口先用真实路由占位，避免点进去 404。
 */
const SECTIONS: Record<string, { title: string; description: string }> = {
  "ai-review": {
    title: "AI 审核管理",
    description: "查看 AI 自动审核的命中记录，处理需要人工复核的条目。",
  },
  "report-comments": {
    title: "评论举报管理",
    description: "处理用户对评论提交的举报，支持隐藏、删除与驳回。",
  },
  "report-ratings": {
    title: "评价举报管理",
    description: "处理用户对评价提交的举报。",
  },
  appeals: {
    title: "申诉管理",
    description: "审核用户对已隐藏内容或封禁提交的申诉。",
  },
  feedback: {
    title: "游戏反馈管理",
    description: "汇总用户对具体条目的纠错、补充与反馈。",
  },
  reports: {
    title: "举报管理",
    description: "讨论、评价与用户三类举报的受理与处置。",
  },
  patches: {
    title: "补丁资源管理",
    description: "与下载资源分开的补丁条目，发布游戏时一并提交。",
  },
  creators: {
    title: "创作者申请",
    description: "审核用户提交的创作者申请与整理方向说明。",
  },
  release: {
    title: "发布游戏",
    description: "录入新条目：标题、会社、平台、语言、标签与资源信息。",
  },
  "first-release": {
    title: "首次资源发布申请",
    description: "审核用户首次发布资源时的资质与内容。",
  },
  logs: {
    title: "管理日志",
    description: "记录管理员的关键操作，便于追溯。",
  },
  oidc: {
    title: "OIDC 应用",
    description: "管理第三方登录应用与回调地址。",
  },
  settings: {
    title: "网站设置",
    description: "站点名称、备案信息、开关与公告配置。",
  },
  mail: {
    title: "邮件群发",
    description: "向用户分组发送通知邮件，需要配置 SMTP。",
  },
};

export default async function AdminSectionPage({
  params,
}: PageProps<"/admin/[section]">) {
  const { section } = await params;
  const meta = SECTIONS[section];
  if (!meta) notFound();

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-subtle" />}>
      <Content meta={meta} />
    </Suspense>
  );
}

async function Content({ meta }: { meta: { title: string; description: string } }) {
  await requireAdmin();
  return <AdminPlaceholder title={meta.title} description={meta.description} />;
}
