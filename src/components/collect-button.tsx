"use client";

import { useEffect, useState } from "react";

import { HeartIcon } from "@/components/icons";

/**
 * 收藏按钮。
 *
 * 详情页是缓存组件、不能读 cookie，所以收藏状态由这个客户端组件在挂载后拉取；
 * 点击时先乐观更新图标，再请求接口，失败则回滚。
 */
export function CollectButton({ gameId, initialCount = 0 }: { gameId: string; initialCount?: number }) {
  const [collected, setCollected] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/collected?gameId=${encodeURIComponent(gameId)}`)
      .then((response) => response.json())
      .then((data: { collected?: boolean }) => {
        if (!cancelled) setCollected(Boolean(data.collected));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  async function toggle() {
    if (busy) return;
    const next = !collected;
    setBusy(true);
    setCollected(next);
    setCount((value) => Math.max(0, value + (next ? 1 : -1)));

    try {
      const response = await fetch("/api/collected", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        collected?: boolean;
        count?: number;
        error?: string;
      };

      if (!data.ok) {
        // 未登录或失败 → 回滚
        setCollected(!next);
        setCount((value) => Math.max(0, value + (next ? -1 : 1)));
        if (data.error) window.alert(data.error);
        return;
      }

      setCollected(Boolean(data.collected));
      if (typeof data.count === "number") setCount(data.count);
    } catch {
      setCollected(!next);
      setCount((value) => Math.max(0, value + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || !ready}
      aria-label={collected ? "取消收藏" : "收藏"}
      title={collected ? "已收藏，点击取消" : "收藏"}
      className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] transition-colors disabled:opacity-70 ${
        collected
          ? "border-rose/45 bg-rose-soft text-rose"
          : "border-line text-muted hover:border-primary/40 hover:text-primary-strong"
      }`}
    >
      <HeartIcon size={15} filled={collected} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
