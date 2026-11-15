import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import {
  BookmarkIcon,
  CommentIcon,
  LinkIcon,
  PackageIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import { toggleFollowAction } from "@/app/user/follow-actions";
import { startConversationAction } from "@/app/message/dm-actions";
import { FollowStats } from "@/components/follow-stats";
import { ReportButton } from "@/components/report-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserComments, getUserProfile } from "@/lib/users";
import { ROLE_LABEL } from "@/lib/permissions";
import { formatDate } from "@/lib/site";
import { TimeAgo } from "@/components/time-ago";

export async function generateMetadata(props: PageProps<"/user/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  const profile = await getUserProfile(username);
  if (!profile) notFound();
  return { title: `${profile.displayName} 的主页` };
}

export default function UserPage(props: PageProps<"/user/[username]">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <Profile params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

const TABS = [
  { key: "comments", label: "评论" },
  { key: "ratings", label: "评价" },
  { key: "collections", label: "收藏夹" },
  { key: "resources", label: "发布资源" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

async function Profile({
  params,
  searchParams,
}: {
  params: PageProps<"/user/[username]">["params"];
  searchParams: PageProps<"/user/[username]">["searchParams"];
}) {
  const [{ username }, raw] = await Promise.all([params, searchParams]);
  const profile = await getUserProfile(username);
  if (!profile) notFound();

  const tabParam = Array.isArray(raw?.tab) ? raw?.tab[0] : raw?.tab;
  const activeTab: TabKey = TABS.some((item) => item.key === tabParam)
    ? (tabParam as TabKey)
    : "comments";

  // 四个 tab 的数据（数量小，直接查）
  const [ratings, collections, resources] = await Promise.all([
    db.rating.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, score: true, game: { select: { slug: true, title: true } } },
    }),
    db.collection.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, game: { select: { slug: true, title: true, coverUrl: true } } },
    }),
    db.resource.findMany({
      where: { authorId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, url: true, game: { select: { slug: true, title: true } } },
    }),
  ]);

  const comments = await getUserComments(username);

  // 关注状态：仅登录且非本人时需要判断
  const viewer = await getSession();
  const isFollowing = viewer
    ? Boolean(
        await db.follow.findUnique({
          where: { followerId_followingId: { followerId: viewer.id, followingId: profile.id } },
          select: { followerId: true },
        }),
      )
    : false;

  // 对方是否也关注了我 → 互为关注
  const followsMe = viewer
    ? Boolean(
        await db.follow.findUnique({
          where: { followerId_followingId: { followerId: profile.id, followingId: viewer.id } },
          select: { followerId: true },
        }),
      )
    : false;

  const mutual = isFollowing && followsMe;

  // 粉丝 / 关注列表（用于主页弹窗）
  const [followers, following] = await Promise.all([
    db.follow.findMany({
      where: { followingId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        follower: { select: { username: true, displayName: true, avatarUrl: true } },
      },
    }),
    db.follow.findMany({
      where: { followerId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        following: { select: { username: true, displayName: true, avatarUrl: true } },
      },
    }),
  ]);

  const stats = [
    { icon: <CommentIcon size={17} />, value: profile.commentCount, label: "评论", tab: "comments" },
    { icon: <UserIcon size={17} />, value: profile.ratingCount, label: "评价", tab: "ratings" },
    { icon: <BookmarkIcon size={17} />, value: profile.collectionCount, label: "收藏", tab: "collections" },
    { icon: <PackageIcon size={17} />, value: profile.resourceCount, label: "发布资源", tab: "resources" },
  ];

  return (
    <>
      <Breadcrumb items={[{ label: `${profile.displayName} 的主页` }]} />

      <div className="mt-4 grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-2xl border border-line bg-surface p-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[32px] font-semibold text-white">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              profile.displayName.slice(0, 1)
            )}
          </div>

          <h1 className="mt-4 text-[21px] font-semibold text-ink">{profile.displayName}</h1>
          <span className="mt-1.5 inline-block rounded-md bg-primary-soft px-2 py-0.5 text-[12.5px] font-medium text-primary-strong">
            {ROLE_LABEL[profile.role as keyof typeof ROLE_LABEL] ?? "用户"}
          </span>

          {mutual && (
            <span className="ml-1.5 inline-block rounded-md bg-mint-soft px-2 py-0.5 align-middle text-[12.5px] font-medium text-mint">
              互相关注
            </span>
          )}

          <FollowStats
            followers={followers.map((row) => row.follower)}
            following={following.map((row) => row.following)}
            followerCount={profile.followerCount}
            followingCount={profile.followingCount}
          />

          <div className="mt-5 space-y-2 text-left text-[13px] text-muted">
            <p className="flex items-center gap-1.5">
              <LinkIcon size={13} className="text-faint" />
              /user/{profile.username}
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-faint">◷</span>
              加入于 {formatDate(profile.createdAt)}
            </p>
          </div>

          <div className="mt-5 border-t border-line pt-4 text-left">
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-muted">樱花点</span>
              <span className="font-medium text-ink">{profile.points}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet to-primary"
                style={{ width: `${Math.min(100, (profile.points / 2000) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {viewer && viewer.id === profile.id ? (
              <>
                <Link
                  href="/settings/profile"
                  className="block w-full rounded-xl bg-primary-soft py-2 text-center text-[14px] font-medium text-primary-strong transition-colors hover:bg-primary/15"
                >
                  编辑信息
                </Link>
                <Link
                  href="/settings/creator"
                  className="block w-full rounded-xl bg-primary py-2 text-center text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
                >
                  申请成为创作者
                </Link>
              </>
            ) : viewer ? (
              <form action={toggleFollowAction}>
                <input type="hidden" name="username" value={profile.username} />
                {isFollowing ? (
                  <ConfirmSubmitButton
                    label={mutual ? "互相关注 · 点击取消" : "已关注 · 点击取消"}
                    title={`取消关注 ${profile.displayName}？`}
                    description={
                      mutual
                        ? "你们目前互相关注，取消后对方仍在关注你，你的关注列表将不再包含 TA。"
                        : "取消后 TA 的新动态不会再出现在你的关注列表里，可以随时重新关注。"
                    }
                    confirmText="取消关注"
                    className="w-full rounded-xl border border-line py-2 text-[14px] font-medium text-ink-soft transition-colors hover:border-rose/40 hover:text-rose"
                  />
                ) : (
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
                  >
                    关注
                  </button>
                )}
              </form>
            ) : (
              <Link
                href={`/login?next=/user/${profile.username}`}
                className="block w-full rounded-xl bg-primary py-2 text-center text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
              >
                登录后关注
              </Link>
            )}

            {viewer && viewer.id !== profile.id && (
              <form action={startConversationAction}>
                <input type="hidden" name="toUserId" value={profile.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-line py-2 text-[14px] font-medium text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong"
                >
                  发私信
                </button>
              </form>
            )}

            {viewer && viewer.id !== profile.id && (
              <div className="pt-1 text-center">
                <ReportButton targetType="USER" targetId={profile.id} label="用户" />
              </div>
            )}
          </div>
        </aside>

        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={`/user/${profile.username}?tab=${stat.tab}`}
                className={`rounded-2xl border bg-surface px-4 py-3.5 transition-colors hover:border-primary/40 ${
                  activeTab === stat.tab ? "border-primary/50" : "border-line"
                }`}
              >
                <div className="flex items-center gap-2 text-muted">
                  {stat.icon}
                  <span className="text-[13.5px]">{stat.label}</span>
                </div>
                <p className="mt-1.5 text-[21px] font-semibold text-ink">{stat.value}</p>
              </Link>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-surface">
            <div className="flex items-center gap-1 border-b border-line px-3 py-2">
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={`/user/${profile.username}?tab=${tab.key}`}
                  className={
                    activeTab === tab.key
                      ? "rounded-lg bg-subtle px-3 py-1.5 text-[14px] font-medium text-ink"
                      : "rounded-lg px-3 py-1.5 text-[14px] text-muted transition-colors hover:text-ink"
                  }
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "comments" && (
                comments.length === 0 ? (
                  <p className="py-12 text-center text-[14px] text-muted">这个孩子还没有发布过评论哦</p>
                ) : (
                  <ul className="space-y-4">
                    {comments.map((comment) => (
                      <li key={comment.id} className="border-b border-line pb-3 last:border-0">
                        <p className="text-[14.5px] leading-relaxed text-ink-soft">{comment.content}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-faint">
                          <Link
                            href={`/galgame/${comment.game.slug}`}
                            className="text-primary-strong hover:underline"
                          >
                            {comment.game.title}
                          </Link>
                          <span>·</span>
                          <span>
                            <TimeAgo value={comment.createdAt} />
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {activeTab === "ratings" && (
                ratings.length === 0 ? (
                  <p className="py-12 text-center text-[14px] text-muted">还没有评价过任何条目</p>
                ) : (
                  <ul className="space-y-3">
                    {ratings.map((rating) => (
                      <li
                        key={rating.id}
                        className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0"
                      >
                        <Link
                          href={`/galgame/${rating.game.slug}?tab=ratings`}
                          className="text-[14.5px] text-primary-strong hover:underline"
                        >
                          {rating.game.title}
                        </Link>
                        <span className="flex items-center gap-1 text-[13.5px] text-muted">
                          <StarIcon size={13} />
                          {rating.score}
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {activeTab === "collections" && (
                collections.length === 0 ? (
                  <p className="py-12 text-center text-[14px] text-muted">收藏夹还是空的</p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {collections.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/galgame/${item.game.slug}`}
                          className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition-colors hover:border-primary/40"
                        >
                          {item.game.coverUrl && (
                            <img
                              src={item.game.coverUrl}
                              alt=""
                              className="h-12 w-16 shrink-0 rounded-md object-cover"
                            />
                          )}
                          <span className="min-w-0 truncate text-[14px] text-ink">{item.game.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {activeTab === "resources" && (
                resources.length === 0 ? (
                  <p className="py-12 text-center text-[14px] text-muted">还没有发布过资源</p>
                ) : (
                  <ul className="space-y-3">
                    {resources.map((resource) => (
                      <li
                        key={resource.id}
                        className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0"
                      >
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="min-w-0 truncate text-[14.5px] text-primary-strong hover:underline"
                        >
                          {resource.title}
                        </a>
                        <Link
                          href={`/galgame/${resource.game.slug}`}
                          className="shrink-0 text-[12.5px] text-faint hover:text-ink"
                        >
                          {resource.game.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
