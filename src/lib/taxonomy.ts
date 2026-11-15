import { cacheLife, cacheTag } from "next/cache";

import { db } from "./db";
import type { GameCardData } from "./games";
import { decodeUrlSegment } from "./site";

/** 标签与会社的读取层 */

export type TagListItem = {
  slug: string;
  name: string;
  kind: "GENRE" | "PLATFORM" | "LANGUAGE" | "THEME";
  count: number;
};

export async function listTags(query?: string | null): Promise<TagListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tags");

  const search = query?.trim() ?? "";
  const tags = await db.tag.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    select: { slug: true, name: true, kind: true, _count: { select: { games: true } } },
    orderBy: { name: "asc" },
  });

  return tags
    .map((tag) => ({ slug: tag.slug, name: tag.name, kind: tag.kind, count: tag._count.games }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

export async function getTagBySlug(slug: string): Promise<TagListItem | null> {
  "use cache";
  cacheLife("minutes");
  const key = decodeUrlSegment(slug);
  cacheTag("tags", `tag-${key}`);

  const tag = await db.tag.findUnique({
    where: { slug: key },
    select: { slug: true, name: true, kind: true, _count: { select: { games: true } } },
  });
  if (!tag) return null;
  return { slug: tag.slug, name: tag.name, kind: tag.kind, count: tag._count.games };
}

export type CompanyListItem = {
  slug: string;
  name: string;
  aliases: string[];
  mainLanguage: string | null;
  count: number;
};

export type CompanyDetail = CompanyListItem & {
  website: string | null;
  region: string | null;
  description: string | null;
  logoUrl: string | null;
  games: GameCardData[];
};

export async function listCompanies(query?: string | null): Promise<CompanyListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("companies");

  const search = query?.trim() ?? "";
  const companies = await db.company.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { aliases: { has: search } },
          ],
        }
      : undefined,
    select: {
      slug: true,
      name: true,
      aliases: true,
      mainLanguage: true,
      _count: { select: { games: true } },
    },
    orderBy: { name: "asc" },
  });

  return companies
    .map((company) => ({
      slug: company.slug,
      name: company.name,
      aliases: company.aliases,
      mainLanguage: company.mainLanguage,
      count: company._count.games,
    }))
    .filter((company) => company.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

export async function getCompanyBySlug(slug: string): Promise<CompanyDetail | null> {
  "use cache";
  cacheLife("minutes");
  const key = decodeUrlSegment(slug);
  cacheTag("companies", `company-${key}`);

  const company = await db.company.findUnique({
    where: { slug: key },
    select: {
      slug: true,
      name: true,
      aliases: true,
      website: true,
      region: true,
      mainLanguage: true,
      description: true,
      logoUrl: true,
      _count: { select: { games: true } },
      games: {
        orderBy: { resourceUpdatedAt: "desc" },
        select: {
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
        },
      },
    },
  });

  if (!company) return null;

  return {
    slug: company.slug,
    name: company.name,
    aliases: company.aliases,
    website: company.website,
    region: company.region,
    mainLanguage: company.mainLanguage,
    description: company.description,
    logoUrl: company.logoUrl,
    count: company._count.games,
    games: company.games.map((game) => ({
      ...game,
      releaseDate: game.releaseDate ? game.releaseDate.toISOString() : null,
    })),
  };
}
