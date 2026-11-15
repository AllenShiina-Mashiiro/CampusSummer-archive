"use client";

import { useEffect, useState } from "react";

import { SITE } from "@/lib/site";

const STORAGE_KEY = "csa-age-confirmed";

/**
 * 成年访客确认。
 * 站点定位是面向成年用户的非商业档案项目，首次访问时给一次明确提示，
 * 结果存在 localStorage，避免每次刷新都打断阅读。
 */
export function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const confirmed =
        localStorage.getItem(STORAGE_KEY) === "1" ||
        document.cookie.split(";").some((item) => item.trim() === "csa-age=1");
      setVisible(!confirmed);
    } catch {
      // 隐私模式下读写失败时直接放行，不阻塞内容
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  if (!visible) return null;

  function confirm() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
      // 同时写一份 Cookie：换浏览器或清 localStorage 后仍能记住
      document.cookie = "csa-age=1; path=/; max-age=31536000; samesite=lax";
    } catch {
      /* 忽略写入失败 */
    }
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-[19px]">
          ✧
        </div>

        <h2 id="age-gate-title" className="mt-4 text-[20px] font-semibold text-ink">
          请确认你的年龄
        </h2>

        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {SITE.name}（{SITE.latinName}）是面向成年用户的非商业档案项目，
          部分条目涉及成人向内容。本站不托管、不分发任何游戏文件，仅做元数据整理与引用。
        </p>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={confirm}
            className="flex-1 rounded-xl bg-primary py-2.5 text-[14.5px] font-medium text-white transition-colors hover:bg-primary-strong"
          >
            我已满 18 岁
          </button>
          <a
            href="https://www.baidu.com"
            className="rounded-xl border border-line px-4 py-2.5 text-[14.5px] text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong"
          >
            离开
          </a>
        </div>

        <p className="mt-4 text-[12.5px] leading-relaxed text-faint">
          继续使用即表示你已阅读并同意本站的《用户协议与隐私政策》。
        </p>
      </div>
    </div>
  );
}
