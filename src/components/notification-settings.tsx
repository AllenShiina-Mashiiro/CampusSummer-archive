"use client";

import { useEffect, useState } from "react";

import { SettingsCard } from "@/components/settings-card";

const STORAGE_KEY = "csa-notify-prefs";

type Pref = { key: string; label: string; description: string };

const PREFS: Pref[] = [
  { key: "commentReply", label: "评论回复", description: "有人回复你的评论时通知" },
  { key: "resourceUpdate", label: "资源更新", description: "收藏的条目有新资源时通知" },
  { key: "follow", label: "关注动态", description: "你关注的人有新条目时通知" },
  { key: "system", label: "系统通知", description: "站点公告与账号安全提醒" },
];

const PRIVACY: Pref[] = [
  { key: "showCollection", label: "公开收藏夹", description: "允许其他用户查看你的收藏" },
  { key: "showFollowing", label: "公开关注列表", description: "允许其他用户查看你的关注" },
];

/** 通知与隐私：偏好保存在浏览器本地（隐私项），账号级偏好可后续接入 UserPreference 表 */
export function NotificationSettings() {
  const [state, setState] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setState(raw ? JSON.parse(raw) : {});
    } catch {
      setState({});
    }
    setReady(true);
  }, []);

  function toggle(key: string, value: boolean) {
    const next = { ...state, [key]: value };
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* 忽略写入失败 */
    }
  }

  return (
    <div className="space-y-4">
      <SettingsCard title="通知" description="选择你希望收到的提醒类型，修改会立即生效。">
        <ul className="divide-y divide-line">
          {PREFS.map((pref) => (
            <li key={pref.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-[14.5px] text-ink">{pref.label}</p>
                <p className="mt-0.5 text-[13px] text-muted">{pref.description}</p>
              </div>
              <Switch
                checked={ready ? (state[pref.key] ?? true) : true}
                onChange={(value) => toggle(pref.key, value)}
                label={pref.label}
              />
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard title="隐私" description="控制哪些内容对访客可见。">
        <ul className="divide-y divide-line">
          {PRIVACY.map((pref) => (
            <li key={pref.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-[14.5px] text-ink">{pref.label}</p>
                <p className="mt-0.5 text-[13px] text-muted">{pref.description}</p>
              </div>
              <Switch
                checked={ready ? (state[pref.key] ?? false) : false}
                onChange={(value) => toggle(pref.key, value)}
                label={pref.label}
              />
            </li>
          ))}
        </ul>
      </SettingsCard>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={
        checked
          ? "relative h-6 w-11 shrink-0 rounded-full bg-primary transition-colors"
          : "relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors"
      }
    >
      <span
        className={
          checked
            ? "absolute top-0.5 left-0.5 h-5 w-5 translate-x-5 rounded-full bg-white shadow-sm transition-transform"
            : "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
        }
      />
    </button>
  );
}
