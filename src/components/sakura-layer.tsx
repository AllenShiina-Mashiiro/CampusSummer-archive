"use client";

import { useEffect, useState } from "react";

import SakuraPetals from "@/components/sakura-petals";

const STORAGE_KEY = "csa-sakura";
const EVENT = "csa-sakura-change";

export function isSakuraEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSakuraEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* 忽略写入失败 */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** 站点级樱花特效：默认开启，层级压在顶栏之下、内容之上 */
export function SakuraLayer() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isSakuraEnabled());

    const onChange = () => setEnabled(isSakuraEnabled());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  if (!enabled) return null;
  return <SakuraPetals count={40} zIndex={30} />;
}

/** 设置页里的开关 */
export function SakuraToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSakuraEnabled());
    const onChange = () => setEnabled(isSakuraEnabled());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="樱花特效"
      onClick={() => setSakuraEnabled(!enabled)}
      className={
        enabled
          ? "relative h-6 w-11 shrink-0 rounded-full bg-primary transition-colors"
          : "relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors"
      }
    >
      <span
        className={
          enabled
            ? "absolute top-0.5 left-0.5 h-5 w-5 translate-x-5 rounded-full bg-white shadow-sm transition-transform"
            : "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
        }
      />
    </button>
  );
}
