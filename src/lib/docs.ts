import { cacheLife, cacheTag } from "next/cache";

import { db } from "./db";
import { decodeUrlSegment, estimateWordCount } from "./site";

/** 帮助文档读取层 */

export const DOC_CATEGORY_LABEL = {
  NOTICE: "公告",
  GUIDE: "使用指南",
  POLICY: "协议与政策",
  ABOUT: "关于项目",
} as const;

export type DocCategory = keyof typeof DOC_CATEGORY_LABEL;

export type DocListItem = {
  slug: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  category: DocCategory;
  wordCount: number;
  updatedAt: string;
};

export async function listDocs(): Promise<DocListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("docs");

  const docs = await db.doc.findMany({
    where: { published: true },
    select: {
      slug: true,
      title: true,
      summary: true,
      coverUrl: true,
      category: true,
      wordCount: true,
      updatedAt: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return docs.map((doc) => ({
    ...doc,
    updatedAt: doc.updatedAt.toISOString(),
  }));
}

/** 侧边栏按分类分组，顺序固定，空分类不展示 */
export async function getDocTree(): Promise<
  { category: DocCategory; label: string; docs: { slug: string; title: string }[] }[]
> {
  "use cache";
  cacheLife("minutes");
  cacheTag("docs");

  const docs = await db.doc.findMany({
    where: { published: true },
    select: { slug: true, title: true, category: true },
    orderBy: { updatedAt: "desc" },
  });

  const order: DocCategory[] = ["NOTICE", "GUIDE", "POLICY", "ABOUT"];

  return order
    .map((category) => ({
      category,
      label: DOC_CATEGORY_LABEL[category],
      docs: docs
        .filter((doc) => doc.category === category)
        .map((doc) => ({ slug: doc.slug, title: doc.title })),
    }))
    .filter((group) => group.docs.length > 0);
}

export type ActivityItem = {
  slug: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  category: DocCategory;
  updatedAt: string;
  authorName: string;
  authorUsername: string | null;
  authorAvatar: string | null;
};

/** 首页活动轮播：公告与文档按时间倒序 */
export async function getActivityItems(take = 5): Promise<ActivityItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("docs");

  const docs = await db.doc.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      slug: true,
      title: true,
      summary: true,
      coverUrl: true,
      category: true,
      updatedAt: true,
      author: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });

  return docs.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    coverUrl: doc.coverUrl,
    category: doc.category,
    updatedAt: doc.updatedAt.toISOString(),
    authorName: doc.author?.displayName ?? "档案组",
    authorUsername: doc.author?.username ?? null,
    authorAvatar: doc.author?.avatarUrl ?? null,
  }));
}

export async function getDocBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  const key = decodeUrlSegment(slug);
  cacheTag("docs", `doc-${key}`);

  const doc = await db.doc.findUnique({
    where: { slug: key },
    select: {
      slug: true,
      title: true,
      summary: true,
      content: true,
      category: true,
      coverUrl: true,
      wordCount: true,
      updatedAt: true,
      author: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });

  if (!doc) return null;
  return {
    ...doc,
    wordCount: doc.wordCount || estimateWordCount(doc.content),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
