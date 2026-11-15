"use client";

import { useState } from "react";

import { LinkIcon } from "@/components/icons";

/** 分享：复制当前页面地址到剪贴板 */
export function ShareButton({ title }: { title?: string }) {
  const [done, setDone] = useState(false);

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: title ?? document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // 用户取消分享或剪贴板不可用时静默处理
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="分享"
      title={done ? "链接已复制" : "复制链接"}
      className={`flex h-8 items-center justify-center gap-1 rounded-lg border px-2 transition-colors ${
        done
          ? "border-mint/40 text-mint"
          : "border-line text-muted hover:border-primary/40 hover:text-primary-strong"
      }`}
    >
      <LinkIcon size={15} />
      {done && <span className="text-[12.5px]">已复制</span>}
    </button>
  );
}
