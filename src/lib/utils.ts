/** 与展示相关的纯函数工具 */

/** 生成 URL slug：保留拉丁字母/数字，中文标题则回退到随机短码 */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const latin = base.replace(/[\u4e00-\u9fa5]/g, "");
  if (latin.replace(/-/g, "").length >= 2) return base;

  return `post-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 中文按字、英文按词的估算方式，约每分钟 300 字（混合语言同用此均值） */
export function estimateReadingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_`~\-]/g, " ");

  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (text.match(/[A-Za-z0-9]+/g) ?? []).length;

  return Math.max(1, Math.round((cjk + words) / 300));
}

/** 取正文纯文本开头做摘要 */
export function buildExcerpt(markdown: string, limit = 140): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Shanghai",
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  return dateFormatter.format(value);
}

export function absoluteUrl(pathname: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export const PAGE_SIZE = 6;
