/**
 * 站点常量与轻量工具函数
 */

export const SITE = {
  name: "学园夏日局",
  latinName: "CampusSummer Archive",
  tagline: "游戏文化档案",
  description:
    "面向游戏文化领域的非商业档案与资料整理项目，记录作品、创作脉络与社区文化。",
} as const;

/**
 * 页脚年份用构建期常量：Cache Components 不允许在渲染时读取当前时间
 * （会导致预渲染结果不稳定）。每年发布时更新一次，或通过环境变量注入。
 */
export const COPYRIGHT_YEAR = process.env.NEXT_PUBLIC_SITE_YEAR ?? "2026";

export const NAV_ITEMS = [
  { href: "/galgame", label: "游戏下载" },
  { href: "/tags", label: "游戏标签" },
  { href: "/companies", label: "游戏会社" },
  { href: "/docs", label: "帮助文档" },
] as const;

/** 38.3w / 9.3w / 1.2k 这类紧凑计数，和参考站一致 */
export function compactNumber(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}亿`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(1).replace(/\.0$/, "")}w`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Shanghai",
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  return dateFormatter.format(value).replace(/\//g, "-");
}

/** 相对时间：3 小时前 / 2 天前 / 1 年前 */
export function relativeTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - value.getTime();
  if (Number.isNaN(diff)) return "";

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const year = 365 * day;

  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  if (diff < year) return `${Math.floor(diff / (30 * day))} 个月前`;
  return `${Math.floor(diff / year)} 年前`;
}

/** 中文 slug 在 URL 里是百分号编码的；查库前统一安全解码一次 */
export function decodeUrlSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function slugify(input: string): string {  const base = input
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  const latin = base.replace(/[\u4e00-\u9fa5]/g, "");
  if (latin.replace(/-/g, "").length >= 2) return base;

  // 纯中文标题没有拉丁字符时，用内容哈希生成稳定后缀。
  // 不能用 Date.now() / Math.random()：渲染期调用会被 Next 判定为不稳定值并报错。
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 0xffffffff;
  }
  return `entry-${Math.abs(hash).toString(36)}`;
}

export function estimateWordCount(markdown: string): number {
  const cjk = (markdown.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (markdown.match(/[A-Za-z0-9]+/g) ?? []).length;
  return cjk + words;
}

export function absoluteUrl(pathname: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export const PAGE_SIZE = 12;
