"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * 轻量轮询：页面可见时每隔一段时间刷新一次服务端数据。
 * 用于私信会话——新消息不需要手动刷新即可出现。
 */
export function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        // 页面在后台时跳过，避免无谓请求
        if (document.visibilityState === "visible") router.refresh();
      }, intervalMs);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
