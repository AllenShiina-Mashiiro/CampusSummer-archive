import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import {
  CommentIcon,
  DownloadIcon,
  EyeIcon,
  FolderIcon,
  HeartIcon,
  LinkIcon,
  PackageIcon,
  PlusIcon,
  StarIcon,
} from "@/components/icons";
import {
  getGameBySlug,
  getGameComments,
  getGameRatings,
  getRelatedGames,
  type GameDetailData,
  type ResourceData,
} from "@/lib/games";
import { db } from "@/lib/db";
import { compactNumber, formatDate, slugify } from "@/lib/site";
import { addCommentAction, addRatingAction } from "@/app/galgame/review-actions";
import { toggleCollectAction } from "@/app/galgame/collect-actions";
import { CollectButton } from "@/components/collect-button";
import { ShareButton } from "@/components/share-button";
import { MentionText } from "@/components/mention-text";
import { OwnRatingActions } from "@/components/own-rating-actions";
import { LikeButton } from "@/components/like-button";
import { OwnCommentActions } from "@/components/own-comment-actions";
import { ReportButton } from "@/components/report-button";
import { MentionTextarea } from "@/components/mention-textarea";
import { toggleResourceLikeAction } from "@/app/galgame/like-actions";
import { TimeAgo } from "@/components/time-ago";
import { LevelBadge } from "@/components/level-badge";

type Tab = "info" | "resources" | "comments" | "ratings";

const TABS: { key: Tab; label: string }[] = [
  { key: "info", label: "游戏信息" },
  { key: "resources", label: "资源链接" },
  { key: "comments", label: "讨论版" },
  { key: "ratings", label: "游戏评价" },
];

export async function generateMetadata(props: PageProps<"/galgame/[slug]">): Promise<Metadata> {
  const { slug: rawSlug } = await props.params;
  const slug = decodeURIComponent(rawSlug);
  const game = await getGameBySlug(slug);
  // Next 16 在流式输出开始后无法再改状态码：这里抛 notFound() 会渲染 404 UI 并注入 noindex，
  // 但响应状态仍是 200（见 docs: file-conventions/not-found#status-codes）。
  if (!game) notFound();

  return {
    title: game.title,
    description: game.summary.slice(0, 120),
    openGraph: {
      title: game.title,
      description: game.summary.slice(0, 120),
      images: game.coverUrl ? [game.coverUrl] : undefined,
    },
  };
}

export default function GameDetailPage(props: PageProps<"/galgame/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Suspense fallback={<DetailSkeleton />}>
        <Detail params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Detail({
  params,
  searchParams,
}: {
  params: PageProps<"/galgame/[slug]">["params"];
  searchParams: PageProps<"/galgame/[slug]">["searchParams"];
}) {
  const [{ slug: rawSlug }, raw] = await Promise.all([params, searchParams]);
  // 中文 slug 可能以百分号编码形式到达，先解码再查库
  const slug = decodeURIComponent(rawSlug);
  const game = await getGameBySlug(slug);

  // 兼容直接用标题访问（中文标题不含拉丁字符，slug 与标题不同）
  if (!game) {
    const byTitle = await db.game.findFirst({
      where: { title: slug },
      select: { slug: true },
    });
    if (byTitle) redirect(`/galgame/${byTitle.slug}`);
  }

  if (!game) notFound();

  const purchaseLinks = await db.$queryRaw<{ id: string; label: string; url: string; note: string | null }[]>`
    SELECT id, label, url, note FROM "PurchaseLink" WHERE "gameId" = ${game.id} ORDER BY "createdAt" ASC
  `;

  const tabParam = Array.isArray(raw?.tab) ? raw?.tab[0] : raw?.tab;
  const tab: Tab = TABS.some((item) => item.key === tabParam) ? (tabParam as Tab) : "info";
  const read = (key: string) => {
    const value = Array.isArray(raw?.[key]) ? raw?.[key][0] : raw?.[key];
    return typeof value === "string" ? value : "";
  };

  return (
    <>
      <Breadcrumb items={[{ href: "/galgame", label: "游戏" }, { label: game.title }]} />

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-col gap-5 p-5 lg:flex-row">
          <div className="shrink-0 lg:w-[340px]">
            <div className="overflow-hidden rounded-xl border border-line bg-subtle">
              {game.coverUrl ? (
                <img src={game.coverUrl} alt="" className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center text-[14px] text-faint">
                  暂无封面
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] leading-tight font-bold tracking-tight text-ink">
                {game.title}
              </h1>
              {game.isSfw && (
                <span className="rounded-md bg-mint-soft px-1.5 py-0.5 text-[12px] font-medium text-mint">
                  SFW
                </span>
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-[14px]">
              <Stars value={game.rating} />
              <span className="text-[16px] font-semibold text-ink">{game.rating.toFixed(1)}</span>
              <span className="text-faint">|</span>
              <Link href={`/galgame/${game.slug}?tab=ratings`} className="text-primary-strong hover:underline">
                查看评分分布
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {game.platforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-md bg-primary px-2 py-0.5 text-[12.5px] font-medium text-white"
                >
                  {platform}
                </span>
              ))}
              {game.languages.map((language) => (
                <span
                  key={language}
                  className="rounded-md bg-primary px-2 py-0.5 text-[12.5px] font-medium text-white"
                >
                  {language}
                </span>
              ))}
              {game.tags
                .filter((tag) => tag.kind === "GENRE" || tag.kind === "THEME")
                .map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/tags/${tag.slug}`}
                    className="rounded-md bg-violet-soft px-2.5 py-1 text-[13.5px] font-semibold text-violet transition-opacity hover:opacity-80"
                  >
                    {tag.name}
                  </Link>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={`/galgame/${game.slug}?tab=resources`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
              >
                <DownloadIcon size={15} />
                下载
              </Link>
              <Link
                href={`/galgame/${game.slug}?tab=ratings`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-[14px] text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong"
              >
                <StarIcon size={15} />
                评分
              </Link>
              <CollectButton gameId={game.id} />

              <ShareButton title={game.title} />

              <Link
                href={`/galgame/${game.slug}?tab=comments`}
                aria-label="讨论"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-primary/40 hover:text-primary-strong"
              >
                <CommentIcon size={15} />
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[12px] font-semibold text-white">
                  {game.creator?.avatarUrl ? (
                    <img src={game.creator.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (game.creator?.displayName ?? "A").slice(0, 1)
                  )}
                </span>
                <div className="leading-tight">
                  <p className="text-[14px] font-medium text-ink">
                    {game.creator?.displayName ?? "档案组"}
                  </p>
                  <p className="text-[12.5px] text-faint">
                    {game.releaseDate ? <TimeAgo value={game.releaseDate} /> : "发行日期未知"}发行
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[13.5px] text-muted">
                <span className="flex items-center gap-1">
                  <EyeIcon size={14} className="text-faint" />
                  {compactNumber(game.viewCount)}
                </span>
                <span className="flex items-center gap-1">
                  <DownloadIcon size={14} className="text-faint" />
                  {compactNumber(game.downloadCount)}
                </span>
                <span className="flex items-center gap-1">
                  <HeartIcon size={14} className="text-faint" />
                  {compactNumber(game.favoriteCount)}
                </span>
                <span className="flex items-center gap-1">
                  <StarIcon size={14} className="text-faint" />
                  {game.ratingCount}
                </span>
                <span className="flex items-center gap-1">
                  <CommentIcon size={14} className="text-faint" />
                  {game.commentCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {game.screenshots.length > 0 && (
          <div className="border-t border-line px-5 py-4">
            <p className="mb-2 text-[13px] text-faint">游戏截图</p>
            <div className="grid grid-cols-3 gap-2">
              {game.screenshots.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="aspect-[16/10] w-full rounded-lg border border-line object-cover"
                />
              ))}
            </div>
          </div>
        )}

        <TabBar slug={game.slug} active={tab} counts={{ resources: game.resources.length, comments: game.commentCount }} />
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-6">
        {tab === "info" && <InfoTab game={game} purchaseLinks={purchaseLinks} />}
        {tab === "resources" && (
          <ResourcesTab game={game} rtype={read("rtype")} slug={game.slug} />
        )}
        {tab === "comments" && <CommentsTab gameId={game.id} slug={game.slug} />}
        {tab === "ratings" && <RatingsTab gameId={game.id} slug={game.slug} />}
      </section>

      {tab === "info" && (
        <Suspense fallback={null}>
          <RelatedSection slug={game.slug} tagSlugs={game.tags.map((tag) => tag.slug)} />
        </Suspense>
      )}
    </>
  );
}

function Stars({ value }: { value: number }) {
  const filled = Math.round(value / 2);
  return (
    <span className="flex items-center gap-0.5 text-amber" aria-label={`评分 ${value.toFixed(1)} / 10`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index} size={15} filled={index < filled} />
      ))}
    </span>
  );
}

function TabBar({
  slug,
  active,
  counts,
}: {
  slug: string;
  active: Tab;
  counts: { resources: number; comments: number };
}) {
  const labels: Record<Tab, string> = {
    info: "游戏信息",
    resources: `资源链接${counts.resources ? ` ${counts.resources}` : ""}`,
    comments: `讨论版${counts.comments ? ` ${counts.comments}` : ""}`,
    ratings: "游戏评价",
  };

  return (
    <div className="border-t border-line px-3 py-2">
      <div className="flex items-center gap-1 rounded-xl bg-subtle p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/galgame/${slug}?tab=${tab.key}`}
            scroll={false}
            className={
              active === tab.key
                ? "flex-1 rounded-lg bg-surface py-2 text-center text-[14.5px] font-medium text-ink shadow-sm"
                : "flex-1 rounded-lg py-2 text-center text-[14.5px] text-muted transition-colors hover:text-ink"
            }
          >
            {labels[tab.key]}
          </Link>
        ))}
      </div>
    </div>
  );
}

function InfoTab({
  game,
  purchaseLinks,
}: {
  game: GameDetailData;
  purchaseLinks: { id: string; label: string; url: string; note: string | null }[];
}) {
  return (
    <div>
      <h2 className="text-[20px] font-semibold text-ink">游戏介绍</h2>

      <div className="mt-4 space-y-3 text-[15.5px] leading-[1.9] text-ink-soft">
        {game.summary.split("\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <dl className="mt-8 grid gap-x-8 gap-y-3 border-t border-line pt-6 text-[14.5px] sm:grid-cols-2">
        <Meta label="原名" value={game.originalTitle ?? "—"} />
        <Meta label="罗马字" value={game.romanizedTitle ?? "—"} />
        {game.company ? (
          <div>
            <dt className="text-[13.5px] text-faint">开发会社</dt>
            <dd className="mt-1">
              <Link
                href={`/companies/${game.company.slug}`}
                className="inline-flex rounded-lg bg-violet-soft px-2.5 py-1 text-[14px] font-semibold text-violet transition-opacity hover:opacity-80"
              >
                {game.company.name}
              </Link>
            </dd>
          </div>
        ) : (
          <Meta label="开发会社" value="—" />
        )}
        <Meta label="发行日期" value={formatDate(game.releaseDate)} />
        {[
          { label: "平台", values: game.platforms },
          { label: "语言", values: game.languages },
        ].map((row) => (
          <div key={row.label}>
            <dt className="text-[13.5px] text-faint">{row.label}</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-1.5">
              {row.values.length === 0 && <span className="text-[14px] text-ink-soft">—</span>}
              {row.values.map((value) => (
                <Link
                  key={value}
                  href={`/tags/${slugify(value)}`}
                  className="rounded-lg bg-primary-soft px-2.5 py-1 text-[13.5px] font-medium text-primary-strong transition-opacity hover:opacity-80"
                >
                  {value}
                </Link>
              ))}
            </dd>
          </div>
        ))}
        <Meta label="别名" value={game.aliases.join("、") || "—"} />
        <Meta label="资源更新" value={formatDate(game.resourceUpdatedAt)} />
      </dl>

      {purchaseLinks.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[20px] font-semibold text-ink">支持正版</h2>
          <div className="mt-3 space-y-2">
            {purchaseLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block rounded-xl border border-line px-4 py-3 transition-colors hover:border-primary/40"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[12.5px] font-medium text-primary-strong">
                    外部链接
                  </span>
                  <span className="text-[13.5px] text-ink-soft">{link.label}</span>
                </span>
                {link.note && <span className="ml-2 text-[12.5px] text-faint">{link.note}</span>}
                <span className="mt-1 block truncate text-[13.5px] text-[#0969da] hover:underline">
                  {link.url}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {game.company && (
        <p className="mt-6 text-[15px] text-muted">
          该条目的会社信息见{" "}
          <Link
            href={`/companies/${game.company.slug}`}
            className="rounded-md bg-violet-soft px-2.5 py-1 text-[13.5px] font-semibold text-violet hover:opacity-80"
          >
            {game.company.name}
          </Link>
          。
        </p>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-muted">{label}</dt>
      <dd className="text-ink-soft">{value}</dd>
    </div>
  );
}

function ResourcesTab({
  game,
  rtype,
  slug,
}: {
  game: GameDetailData;
  rtype: string;
  slug: string;
}) {
  const isPatch = rtype === "patches";
  const scoped = game.resources.filter((resource) =>
    isPatch ? resource.type === "PATCH" : resource.type !== "PATCH",
  );

  const official = scoped.filter((resource) => resource.provider === "OFFICIAL");
  const community = scoped.filter((resource) => resource.provider === "COMMUNITY");

  const tabs = [
    { key: "resources", label: "游戏本体资源", count: game.resources.filter((r) => r.type !== "PATCH").length },
    { key: "patches", label: "补丁资源", count: game.resources.filter((r) => r.type === "PATCH").length },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-line bg-subtle p-1">
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={`/galgame/${slug}?tab=resources${item.key === "patches" ? "&rtype=patches" : ""}`}
              className={
                (item.key === "patches") === isPatch
                  ? "rounded-lg bg-surface px-4 py-1.5 text-[14px] font-medium text-ink shadow-sm"
                  : "rounded-lg px-4 py-1.5 text-[14px] text-muted transition-colors hover:text-ink"
              }
            >
              {item.label}
              {item.count > 0 && <span className="ml-1.5 text-[12.5px] text-faint">{item.count}</span>}
            </Link>
          ))}
        </div>

        <Link
          href={`/creator/games/${game.id}#resource-form`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-[14px] font-medium text-primary-strong transition-colors hover:bg-primary/15"
        >
          <PlusIcon size={14} />
          添加资源
        </Link>
      </div>

      <div className="mt-3 space-y-1 text-[14.5px] leading-relaxed text-muted">
        <p>请注意，本站的条目资源均来自互联网或用户上传，请自行鉴别资源安全性。</p>
        <p>使用资源前请认真阅读资源的备注（如果有），以免产生问题。</p>
      </div>

      <ResourceGroup title="官方来源（推荐）" hint="由官方或授权渠道提供的入口" resources={official} slug={slug} />
      <ResourceGroup title="社区整理" hint="来自社区用户的整理与说明" resources={community} slug={slug} />

      {scoped.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-line py-12 text-center text-[14px] text-muted">
          {isPatch ? "还没有补丁资源" : "还没有本体资源"}
        </p>
      )}
    </div>
  );
}

function ResourceGroup({
  title,
  hint,
  resources,
  slug,
}: {
  title: string;
  hint: string;
  resources: ResourceData[];
  slug: string;
}) {
  if (resources.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-line">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-[12px] font-semibold text-primary-strong">
          ⁂
        </span>
        <div>
          <p className="text-[14.5px] font-medium text-ink">{title}</p>
          <p className="text-[12.5px] text-faint">{hint}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-3 px-4 pb-4">
        {resources.map((resource) => (
          <li key={resource.id} className="rounded-xl border border-line px-4 py-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-[15px] font-medium text-primary-strong hover:underline"
                >
                  {resource.title}
                </a>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-primary px-1.5 py-0.5 text-[12px] font-medium text-white">
                    {resource.type === "GAME" ? "游戏本体" : resource.type === "PATCH" ? "补丁" : resource.type === "CG" ? "图片素材" : "其他"}
                  </span>
                  {resource.format && (
                    <span className="rounded-md bg-violet-soft px-1.5 py-0.5 text-[12px] font-medium text-violet">
                      {resource.format}
                    </span>
                  )}
                  {resource.size && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-mint-soft px-1.5 py-0.5 text-[12px] font-medium text-mint">
                      <PackageIcon size={11} />
                      {resource.size}
                    </span>
                  )}
                  {resource.netdisk && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-violet-soft px-1.5 py-0.5 text-[12px] font-medium text-violet">
                      <FolderIcon size={11} />
                      {resource.netdisk}
                    </span>
                  )}
                  {resource.extractCode && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-subtle px-1.5 py-0.5 text-[12px] text-muted">
                      提取码：<code className="text-ink-soft">{resource.extractCode}</code>
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-2 text-[13px] text-muted">
                  <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-subtle text-[10px] font-semibold text-muted">
                    {resource.author?.avatarUrl ? (
                      <img src={resource.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (resource.author?.displayName ?? "?").slice(0, 1)
                    )}
                  </span>
                  {resource.author ? (
                    <Link
                      href={`/user/${resource.author.username}`}
                      className="hover:text-primary-strong hover:underline"
                    >
                      {resource.author.displayName}
                    </Link>
                  ) : (
                    "匿名"
                  )}
                  <span
                    className={
                      resource.provider === "OFFICIAL"
                        ? "rounded-md bg-primary-soft px-1.5 py-0.5 text-[12px] font-medium text-primary-strong"
                        : "rounded-md bg-subtle px-1.5 py-0.5 text-[12px] font-medium text-muted"
                    }
                  >
                    {resource.provider === "OFFICIAL" ? "官方" : "社区"}
                  </span>
                  <span className="text-faint">·</span>
                  <span>发布于 {formatDate(resource.createdAt)}</span>
                </div>

                {resource.note && (
                  <p className="mt-2 text-[13.5px] text-faint">{resource.note}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <form action={toggleResourceLikeAction}>
                  <input type="hidden" name="resourceId" value={resource.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <button
                    type="submit"
                    aria-label="点赞"
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-muted transition-colors hover:bg-subtle hover:text-primary-strong"
                  >
                    <HeartIcon size={13} />
                    {resource.likeCount}
                  </button>
                </form>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label="打开资源"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-strong"
                >
                  <DownloadIcon size={15} />
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function CommentsTab({ gameId, slug }: { gameId: string; slug: string }) {
  const comments = await getGameComments(gameId);

  return (
    <div>
      <h2 className="text-[20px] font-semibold text-ink">讨论版</h2>

      <form action={addCommentAction} className="mt-4 rounded-xl border border-line bg-subtle/60 p-4">
        <input type="hidden" name="gameId" value={gameId} />
        <input type="hidden" name="slug" value={slug} />
        <MentionTextarea
          placeholder="写下你对这部作品的补充、勘误或讨论…（输入 @ 可提醒他人）"
          rows={3}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[13px] text-faint">输入 @ 选择用户，被提及的人会收到通知。</p>
          <button
            type="submit"
            className="rounded-lg bg-primary px-3 py-1.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
          >
            发表讨论
          </button>
        </div>
      </form>

      <ul className="mt-5 space-y-4">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3 border-b border-line pb-4 last:border-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[13px] font-semibold text-white">
              {comment.user.avatarUrl ? (
                <img src={comment.user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                comment.user.displayName.slice(0, 1)
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[13.5px]">
                <Link
                  href={`/user/${comment.user.username}`}
                  className="font-medium text-ink hover:text-primary-strong hover:underline"
                >
                  {comment.user.displayName}
                </Link>
                <LevelBadge points={comment.user.points} />
                <span className="text-faint">
                  <TimeAgo value={comment.createdAt} />
                </span>
              </div>
              <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">
                <MentionText text={comment.content} />
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <LikeButton kind="comment" id={comment.id} initialCount={comment.likeCount} />
                <ReportButton targetType="COMMENT" targetId={comment.id} label="讨论" />
              </div>

              <OwnCommentActions
                commentId={comment.id}
                authorId={comment.user.id}
                content={comment.content}
                slug={slug}
              />
            </div>
          </li>
        ))}
      </ul>

      {comments.length === 0 && (
        <p className="py-10 text-center text-[14.5px] text-muted">还没有讨论，来补充第一条吧。</p>
      )}
    </div>
  );
}

async function RatingsTab({ gameId, slug }: { gameId: string; slug: string }) {
  const ratings = await getGameRatings(gameId);

  return (
    <div>
      <h2 className="text-[20px] font-semibold text-ink">游戏评价</h2>
      <p className="mt-2 text-[14.5px] text-muted">
        评分仅代表档案组与社区用户的整理意见，不作为推荐依据。
      </p>

      <form action={addRatingAction} className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-subtle/60 p-4">
        <input type="hidden" name="gameId" value={gameId} />
        <input type="hidden" name="slug" value={slug} />
        <label htmlFor="score" className="text-[13.5px] text-ink-soft">
          我的评分
        </label>
        <select
          id="score"
          name="score"
          defaultValue="8"
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13.5px] text-ink"
        >
          {Array.from({ length: 10 }).map((_, index) => (
            <option key={index} value={index + 1}>
              {index + 1} 分
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-[13.5px] font-medium text-white transition-colors hover:bg-primary-strong"
        >
          提交评价
        </button>
        <span className="text-[12.5px] text-faint">同一账号重复提交会覆盖上一次评分</span>
      </form>

      <ul className="mt-5 space-y-3">
        {ratings.map((rating) => (
          <li
            key={rating.id}
            className="flex items-center justify-between rounded-xl border border-line px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[12px] font-semibold text-white">
                {rating.user.avatarUrl ? (
                  <img src={rating.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  rating.user.displayName.slice(0, 1)
                )}
              </span>
              <Link
                href={`/user/${rating.user.username}`}
                className="text-[14.5px] text-ink hover:text-primary-strong hover:underline"
              >
                {rating.user.displayName}
              </Link>
              <span className="text-[13px] text-faint">
                <TimeAgo value={rating.createdAt} />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Stars value={rating.score} />
              <span className="text-[14px] font-semibold text-ink">{rating.score.toFixed(1)}</span>
              <LikeButton kind="rating" id={rating.id} />
              <OwnRatingActions ratingId={rating.id} authorId={rating.user.id} slug={slug} />
              <ReportButton targetType="RATING" targetId={rating.id} label="评价" />
            </div>
          </li>
        ))}
      </ul>

      {ratings.length === 0 && (
        <p className="py-10 text-center text-[14.5px] text-muted">还没有评分。</p>
      )}
    </div>
  );
}

async function RelatedSection({ slug, tagSlugs }: { slug: string; tagSlugs: string[] }) {
  const games = await getRelatedGames(slug, tagSlugs);
  if (games.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[16px] font-semibold text-ink">相关条目</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/galgame/${game.slug}`}
            className="card-hover overflow-hidden rounded-[14px] border border-line bg-surface"
          >
            <div className="aspect-[16/10] overflow-hidden bg-subtle">
              {game.coverUrl && (
                <img src={game.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              )}
            </div>
            <p className="clamp-2 px-3 py-2.5 text-[14px] font-medium text-ink">{game.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-40 rounded bg-subtle" />
      <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <div className="flex gap-5">
          <div className="h-[200px] w-[340px] rounded-xl bg-subtle" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-2/3 rounded bg-subtle" />
            <div className="h-4 w-40 rounded bg-subtle" />
            <div className="h-6 w-full rounded bg-subtle" />
            <div className="h-9 w-48 rounded bg-subtle" />
          </div>
        </div>
      </div>
    </div>
  );
}
