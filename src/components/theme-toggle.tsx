"use client";

import { useEffect, useState } from "react";

import { MoonIcon, SunIcon } from "@/components/icons";

const STORAGE_KEY = "csa-theme";

/** 深浅色切换：首屏由 layout 里的内联脚本先行应用，避免闪烁 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // 隐私模式下 localStorage 可能不可写，忽略即可
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
    >
      {dark ? <MoonIcon size={19} /> : <SunIcon size={19} />}
    </button>
  );
}
