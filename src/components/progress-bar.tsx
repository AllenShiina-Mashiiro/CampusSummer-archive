"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * 顶部导航进度条。
 *
 * 只看两件事：站内链接被点击 / 表单被提交 → 开始；pathname 真的变了 → 完成。
 * 之前把「完成」写在了依赖 state 的 effect 里，导致刚开始就被标记完成、
 * 进度条只闪一帧。现在用 ref 记录上一个 pathname，只在路由真变化时收尾。
 */
export function ProgressBar() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const lastPath = useRef(pathname);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const start = () => {
      setActive(true);
      if (safety.current) clearTimeout(safety.current);
      safety.current = setTimeout(() => setActive(false), 10000);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || anchor.target === "_blank") return;
      if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (href === pathname) return;

      start();
    };

    // 表单提交（Server Action / GET 表单）通常也会触发跳转
    const onSubmit = () => start();

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
      if (safety.current) clearTimeout(safety.current);
    };
  }, [pathname]);

  // 路由真的变了 → 收尾
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    if (!active) return;

    setActive(false);
    if (safety.current) clearTimeout(safety.current);
  }, [pathname, active]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`h-full bg-gradient-to-r from-[#7c5cff] via-[#4f8cff] to-[#7c5cff] ${
          active ? "animate-[csa-progress_1.1s_ease-in-out_infinite]" : ""
        }`}
        style={{ width: active ? "35%" : "0%" }}
      />
    </div>
  );
}
