"use client";

import { useEffect, useState } from "react";

import { formatDate, relativeTime } from "@/lib/site";

/**
 * 相对时间（3 天前 / 1 年前）。
 *
 * 服务端渲染绝对日期，挂载后再切换成相对时间：
 * 相对时间依赖 Date.now()，直接参与预渲染会被 Next 判为不稳定值。
 */
export function TimeAgo({ value }: { value: string | null | undefined }) {
  const [text, setText] = useState(() => formatDate(value));

  useEffect(() => {
    setText(relativeTime(value) || formatDate(value));
  }, [value]);

  return <>{text}</>;
}
