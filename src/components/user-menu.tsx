"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  CalendarCheckIcon,
  ChevronDownIcon,
  HelpIcon,
  LogOutIcon,
  PenIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from "@/components/icons";
import { levelFromPoints } from "@/lib/level";
import { can, ROLE_LABEL, type UserRole } from "@/lib/permissions";

type MenuUser = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  points: number;
  role: UserRole;
};

type CheckinReward = {
  imageUrl: string;
  title: string;
  text: string;
};

export function UserMenu({
  user,
  checkin,
}: {
  user: MenuUser | null;
  checkin?: CheckinReward;
}) {
  const [open, setOpen] = useState(false);
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState<string | null>(null);
  const [reward, setReward] = useState<{ points: number; gained: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="ml-1 rounded-full bg-primary px-4 py-1.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
      >
        登录
      </Link>
    );
  }

  const initial = user.displayName.slice(0, 1).toUpperCase();

  return (
    <div ref={containerRef} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="账号菜单"
        className="flex items-center gap-0.5 rounded-full p-0.5 transition-colors hover:bg-subtle"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[14px] font-semibold text-white ring-2 ring-violet-soft">
          {user.avatarUrl ? (
            // 头像可能来自 S3 或本地，统一用原生 img
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <ChevronDownIcon size={14} className="text-faint" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-[0_12px_40px_-12px_rgba(17,24,39,0.22)]"
        >
          <div className="px-3 py-2.5">
            <p className="text-[14px] font-semibold text-ink">{user.displayName}</p>
            <p className="mt-0.5 text-[12px] text-faint">{ROLE_LABEL[user.role]}</p>
          </div>

          <div className="my-1 flex items-center justify-between rounded-lg px-3 py-2 text-[14px] text-ink-soft hover:bg-subtle">
            <span className="flex items-center gap-2.5">
              <SparklesIcon size={16} className="text-violet" />
              樱花点 · LV.{levelFromPoints(user.points).level}
            </span>
            <span className="text-muted">{user.points}</span>
          </div>

          <MenuLink href={`/user/${user.username}`} icon={<UserIcon size={16} />} label="用户主页" />

          {can(user.role, "creator.center") && (
            <MenuLink href="/creator" icon={<PenIcon size={16} />} label="创作中心" />
          )}
          {can(user.role, "admin.access") && (
            <MenuLink href="/admin" icon={<ShieldIcon size={16} />} label="后台管理" />
          )}

          <MenuLink href="/settings/profile" icon={<SettingsIcon size={16} />} label="信息设置" />
          <MenuLink href="/docs" icon={<HelpIcon size={16} />} label="帮助与反馈" />
          <MenuLink
            href="/settings/content"
            icon={<ShieldIcon size={16} />}
            label="网站内容显示"
            trailing
          />

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await fetch("/api/auth/logout", { method: "POST" });
              router.refresh();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] text-ink-soft transition-colors hover:bg-subtle"
          >
            <LogOutIcon size={16} />
            退出登录
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setCheckinBusy(true);
              try {
                const response = await fetch("/api/checkin", { method: "POST" });
                const data = (await response.json()) as {
                  ok: boolean;
                  error?: string;
                  gained?: number;
                  points?: number;
                };

                if (data.ok) {
                  setCheckinMessage(`签到成功 +${data.gained}，当前 ${data.points}`);
                  // 签到成功后弹出站长在「网站设置」里配置的奖励弹窗
                  setReward({
                    points: data.points ?? user.points + (data.gained ?? 0),
                    gained: data.gained ?? 0,
                  });
                  setOpen(false);
                  router.refresh();
                } else {
                  setCheckinMessage(
                    data.error === "already" ? "今天已经签到过了" : "签到失败，请稍后重试",
                  );
                }
              } catch {
                setCheckinMessage("签到失败，请检查网络");
              } finally {
                setCheckinBusy(false);
              }
            }}
            disabled={checkinBusy}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] text-ink-soft transition-colors hover:bg-subtle disabled:opacity-60"
          >
            <CalendarCheckIcon size={16} className="text-violet" />
            {checkinBusy ? "签到中…" : "今日签到"}
            <span className="ml-auto text-[12.5px] text-faint">+10</span>
          </button>

          {checkinMessage && (
            <p className="px-3 pb-1 pt-0.5 text-[12.5px] text-mint">{checkinMessage}</p>
          )}
        </div>
      )}

      {reward && checkin && (
        <div
          role="presentation"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReward(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={checkin.title}
            className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          >
            {checkin.imageUrl && (
              <img src={checkin.imageUrl} alt="" className="h-44 w-full object-cover" />
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[19px] font-semibold tracking-tight text-ink">
                  {checkin.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setReward(null)}
                  aria-label="关闭"
                  className="mt-0.5 text-faint transition-colors hover:text-ink"
                >
                  <XIcon size={16} />
                </button>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-muted">
                {checkin.text}
              </p>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-soft px-4 py-3">
                <span className="text-[14px] text-primary-strong">本次获得</span>
                <span className="text-[16px] font-semibold text-primary-strong">
                  +{reward.gained} 樱花点
                </span>
              </div>
              <p className="mt-2 text-right text-[12.5px] text-faint">当前 {reward.points} 点</p>

              <button
                type="button"
                onClick={() => setReward(null)}
                className="mt-4 w-full rounded-xl bg-primary py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
              >
                收下奖励
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  trailing,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  trailing?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center justify-between rounded-lg px-3 py-2 text-[14px] text-ink-soft transition-colors hover:bg-subtle"
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
      {trailing && <ShieldIcon size={14} className="text-faint" />}
    </Link>
  );
}
