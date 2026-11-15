import { cacheLife, cacheTag } from "next/cache";

import { db } from "./db";
import { PAGE_SIZE } from "./site";

/**
 * 作品条目的读取层。
 */

export type GameTagView = { slug: string; name: string; kind: "GENRE" | "PLATFORM" | "LANGUAGE" | "THEME" };

export type GameCardData = {
  id: string;
  slug: string;
  title: string;
  originalTitle: string | null;
  coverUrl: string | null;
  rating: number;
  ratingCount: number;
  viewCount: number;
  isSfw: boolean;
  platforms: string[];
  languages: string[];
  releaseDate: string | null;
};

export type GameDetailData = GameCardData & {
  romanizedTitle: string | null;
  aliases: string[];
  summary: string;
  bannerUrl: string | null;
  screenshots: string[];
  downloadCount: number;
  favoriteCount: number;
  resourceUpdatedAt: string;
  company: { slug: string; name: string } | null;
  creator: { username: string; displayName: string; avatarUrl: string | null } | null;
  tags: GameTagView[];
  resources: ResourceData[];
  commentCount: number;
};

export type ResourceData = {
  id: string;
  title: string;
  type: "GAME" | "PATCH" | "CG" | "OTHER";
  provider: "OFFICIAL" | "COMMUNITY";
  url: string;
  size: string | null;
  format: string | null;
  netdisk: string | null;
  extractCode: string | null;
  note: string | null;
  likeCount: number;
  downloadCount: number;
  createdAt: string;
  author: { username: string; displayName: string; avatarUrl: string | null } | null;
};

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  originalTitle: true,
  coverUrl: true,
  rating: true,
  ratingCount: true,
  viewCount: true,
  isSfw: true,
  platforms: true,
  languages: true,
  releaseDate: true,
} as const;

type RawCard = {
  id: string;
  slug: string;
  title: string;
  originalTitle: string | null;
  coverUrl: string | null;
  rating: number;
  ratingCount: number;
  viewCount: number;
  isSfw: boolean;
  platforms: string[];
  languages: string[];
  releaseDate: Date | null;
};

function toCard(game: RawCard): GameCardData {
  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    originalTitle: game.originalTitle,
    coverUrl: game.coverUrl,
    rating: game.rating,
    ratingCount: game.ratingCount,
    viewCount: game.viewCount,
    isSfw: game.isSfw,
    platforms: game.platforms,
    languages: game.languages,
    releaseDate: game.releaseDate ? game.releaseDate.toISOString() : null,
  };
}

export type GameSort = "updated" | "rating" | "views";

export type GameListQuery = {
  page?: number;
  sort?: GameSort;
  dir?: "asc" | "desc";
  platform?: string | null;
  language?: string | null;
  tag?: string | null;
  query?: string | null;
  take?: number;
/** 当前用户屏蔽的标签 slug，带这些标签的条目不进列表 */
  excludeTags?: string[];
  excludeIds?: string[];
};

const SORT_FIELD: Record<GameSort, "resourceUpdatedAt" | "rating" | "viewCount"> = {
  updated: "resourceUpdatedAt",
  rating: "rating",
  views: "viewCount",
};

export async function listGames({
  page = 1,
  sort = "updated",
  dir = "desc",
  platform,
  language,
  tag,
  query,
  take,
  excludeTags = [],
  excludeIds = [],
}: GameListQuery = {}): Promise<{ games: GameCardData[]; total: number; page: number; totalPages: number }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("games");

  const safePage = Math.max(1, Math.floor(page));
  const pageSize = take ?? PAGE_SIZE;
  const search = query?.trim() ?? "";

  const where = {
    ...(platform ? { platforms: { has: platform } } : {}),
    ...(language ? { languages: { has: language } } : {}),
    ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
    // 屏蔽：只要条目带有任一被屏蔽标签，就从公开列表里去掉
    ...(excludeTags.length
      ? { NOT: { tags: { some: { tag: { slug: { in: excludeTags } } } } } }
      : {}),
    // 屏蔽：用户主动屏蔽的条目同样不出现
    ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { originalTitle: { contains: search, mode: "insensitive" as const } },
            { romanizedTitle: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, games] = await Promise.all([
    db.game.count({ where }),
    db.game.findMany({
      where,
      select: cardSelect,
      orderBy: { [SORT_FIELD[sort]]: dir },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    games: games.map(toCard),
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getLatestGames(take = 8, excludeTags: string[] = [], excludeIds: string[] = []): Promise<GameCardData[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("games");

  const games = await db.game.findMany({
    where: excludeTags.length
      ? { NOT: { tags: { some: { tag: { slug: { in: excludeTags } } } } } }
      : undefined,
    select: cardSelect,
    orderBy: { resourceUpdatedAt: "desc" },
    take,
  });
  return games.map(toCard);
}

export async function getLatestPatches(take = 4) {
  "use cache";
  cacheLife("minutes");
  cacheTag("games");

  const rows = await db.resource.findMany({
    where: { type: "PATCH" },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      format: true,
      createdAt: true,
      game: { select: { slug: true, title: true, coverUrl: true } },
    },
  });

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export type PatchCardData = Awaited<ReturnType<typeof getLatestPatches>>[number];

export async function getGameBySlug(slug: string): Promise<GameDetailData | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("games", `game-${slug}`);

  const game = await db.game.findUnique({
    where: { slug },
    select: {
      ...cardSelect,
      romanizedTitle: true,
      aliases: true,
      summary: true,
      bannerUrl: true,
      screenshots: true,
      downloadCount: true,
      favoriteCount: true,
      resourceUpdatedAt: true,
      company: { select: { slug: true, name: true } },
      creator: { select: { username: true, displayName: true, avatarUrl: true } },
      tags: { select: { tag: { select: { slug: true, name: true, kind: true } } } },
      resources: {
        orderBy: [{ provider: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          type: true,
          provider: true,
          url: true,
          size: true,
          format: true,
          netdisk: true,
          extractCode: true,
          note: true,
          likeCount: true,
          downloadCount: true,
          createdAt: true,
          author: { select: { username: true, displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { comments: true } },
    },
  });

  if (!game) return null;

  return {
    ...toCard(game),
    romanizedTitle: game.romanizedTitle,
    aliases: game.aliases,
    summary: game.summary,
    bannerUrl: game.bannerUrl,
    screenshots: game.screenshots ?? [],
    downloadCount: game.downloadCount,
    favoriteCount: game.favoriteCount,
    resourceUpdatedAt: game.resourceUpdatedAt.toISOString(),
    company: game.company,
    creator: game.creator,
    tags: game.tags.map((entry) => entry.tag),
    commentCount: game._count.comments,
    resources: game.resources.map((resource) => ({
      ...resource,
      createdAt: resource.createdAt.toISOString(),
    })),
  };
}

export async function getRelatedGames(slug: string, tagSlugs: string[]): Promise<GameCardData[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("games");

  const games = await db.game.findMany({
    where: {
      slug: { not: slug },
      ...(tagSlugs.length ? { tags: { some: { tag: { slug: { in: tagSlugs } } } } } : {}),
    },
    select: cardSelect,
    orderBy: { viewCount: "desc" },
    take: 4,
  });

  return games.map(toCard);
}

export async function getGameComments(gameId: string) {
  const comments = await db.comment.findMany({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      content: true,
      likeCount: true,
      createdAt: true,
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
    },
  });

  return comments.map((comment) => ({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
  }));
}

export async function getGameRatings(gameId: string) {
  const ratings = await db.rating.findMany({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      score: true,
      createdAt: true,
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
    },
  });

  return ratings.map((rating) => ({ ...rating, createdAt: rating.createdAt.toISOString() }));
}

/** 全站统计（首页 / 关于页复用） */
export async function getArchiveStats() {
  "use cache";
  cacheLife("minutes");
  cacheTag("games");

  const [games, companies, tags, docs] = await Promise.all([
    db.game.count(),
    db.company.count(),
    db.tag.count(),
    db.doc.count({ where: { published: true } }),
  ]);

  return { games, companies, tags, docs };
}

/** 随机一部（首页「随机一部游戏」按钮） */
export async function getRandomGameSlug(): Promise<string | null> {
  const total = await db.game.count();
  if (total === 0) return null;
  const skip = Math.floor(Math.random() * total);
  // 必须带 orderBy：没有排序时 skip 取到哪一条由数据库决定，分页结果不稳定
  const game = await db.game.findFirst({
    select: { slug: true },
    orderBy: { id: "asc" },
    skip,
  });
  return game?.slug ?? null;
}
