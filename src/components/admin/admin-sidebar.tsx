"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BellIcon,
  BookIcon,
  CommentIcon,
  DownloadIcon,
  FolderIcon,
  GamepadIcon,
  GlobeIcon,
  ImageIcon,
  PackageIcon,
  SettingsIcon,
  ShieldIcon,
  StarIcon,
  UploadIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import { can, type Capability, type UserRole } from "@/lib/permissions";

type Item = { href: string; label: string; icon: React.ReactNode; cap: Capability };
type Group = { label: string; items: Item[] };

/** 分组与条目都带权限要求，渲染前按角色过滤 */
const GROUPS: Group[] = [
  {
    label: "内容审核",
    items: [
      { href: "/admin/reports", label: "举报管理", icon: <ShieldIcon size={16} />, cap: "report.handle" },
      { href: "/admin/appeals", label: "申诉管理", icon: <BellIcon size={16} />, cap: "appeal.handle" },
      {
        href: "/admin/comments",
        label: "游戏反馈管理",
        icon: <CommentIcon size={16} />,
        cap: "content.moderate",
      },
    ],
  },
  {
    label: "用户与创作者",
    items: [
      { href: "/admin/users", label: "用户管理", icon: <UsersIcon size={16} />, cap: "user.moderate" },
      {
        href: "/admin/creators",
        label: "创作者申请",
        icon: <UserIcon size={16} />,
        cap: "creator.review",
      },
    ],
  },
  {
    label: "资源与作品",
    items: [
      {
        href: "/admin/games/new",
        label: "发布游戏",
        icon: <UploadIcon size={16} />,
        cap: "game.publish",
      },
      { href: "/admin/games", label: "游戏管理", icon: <GamepadIcon size={16} />, cap: "game.publish" },
      {
        href: "/admin/resources",
        label: "下载资源管理",
        icon: <DownloadIcon size={16} />,
        cap: "resource.manage",
      },
      {
        href: "/admin/patches",
        label: "补丁资源管理",
        icon: <FolderIcon size={16} />,
        cap: "resource.manage",
      },
    ],
  },
  {
    label: "系统",
    items: [
      {
        href: "/admin/docs",
        label: "文档与公告",
        icon: <BookIcon size={16} />,
        cap: "site.settings",
      },
      {
        href: "/admin/media",
        label: "媒体库",
        icon: <ImageIcon size={16} />,
        cap: "site.settings",
      },
      { href: "/admin/logs", label: "管理日志", icon: <BookIcon size={16} />, cap: "logs.view" },
      {
        href: "/admin/settings",
        label: "网站设置",
        icon: <SettingsIcon size={16} />,
        cap: "site.settings",
      },
      { href: "/admin/mail", label: "邮件群发", icon: <PackageIcon size={16} />, cap: "mail.send" },
    ],
  },
];

export function AdminSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(role, item.cap)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="w-[240px] shrink-0 border-r border-line bg-surface px-4 py-6">
      <Link href="/admin" className="block px-2 text-[21px] font-bold tracking-tight text-ink">
        管理面板
      </Link>

      <nav className="mt-5 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1.5 text-[12.5px] font-medium tracking-wide text-faint">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "flex items-center gap-2.5 rounded-lg bg-primary-soft px-2.5 py-2 text-[14px] font-medium text-primary-strong"
                          : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
                      }
                    >
                      <span className={active ? "text-primary-strong" : "text-muted"}>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-6 border-t border-line pt-4">
        <Link
          href="/creator"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13.5px] text-muted transition-colors hover:bg-subtle hover:text-ink"
        >
          <StarIcon size={15} />
          创作中心
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13.5px] text-muted transition-colors hover:bg-subtle hover:text-ink"
        >
          <GlobeIcon size={15} />
          返回前台
        </Link>
        <p className="mt-2 px-2.5 py-2 text-[13px] text-faint">CampusSummer</p>
      </div>
    </aside>
  );
}
