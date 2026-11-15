"use client";

import { useEffect, useState } from "react";

import { HeartIcon } from "@/components/icons";

/**
 * 通用点赞按钮（评论 / 评价）。
 * 挂载后拉取状态，点击乐观更新，失败回滚。
 */
export function LikeButton({
  kind,
  id,
  initialCount = 0,
}: {
  kind: "comment" | "rating";
  id: string;
  initialCount?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/like?kind=${kind}&id=${encodeURIComponent(id)}`)
      .then((response) => response.json())
      .then((data: { liked?: boolean; count?: number }) => {
        if (cancelled) return;
        setLiked(Boolean(data.liked));
        if (typeof data.count === "number") setCount(data.count);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  async function toggle() {
    if (busy) return;
    const next = !liked;
    setBusy(true);
    setLiked(next);
    setCount((value) => Math.max(0, value + (next ? 1 : -1)));

    try {
      const response = await fetch("/api/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      const data = (await response.json()) as { ok?: boolean; liked?: boolean; count?: number; error?: string };

      if (!data.ok) {
        setLiked(!next);
        setCount((value) => Math.max(0, value + (next ? -1 : 1)));
        if (data.error) window.alert(data.error);
        return;
      }

      setLiked(Boolean(data.liked));
      if (typeof data.count === "number") setCount(data.count);
    } catch {
      setLiked(!next);
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
      aria-label={liked ? "取消点赞" : "点赞"}
      className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] transition-colors disabled:opacity-70 ${
        liked ? "text-rose" : "text-faint hover:text-rose"
      }`}
    >
      <HeartIcon size={13} filled={liked} />
      {count > 0 ? count : "赞"}
    </button>
  );
}
