import { cache } from "react";

import { db } from "./db";

/** 用户主页、消息中心的读取层（依赖会话，不进全站缓存） */

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  points: number;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  commentCount: number;
  ratingCount: number;
  collectionCount: number;
  resourceCount: number;
};

export const getUserProfile = cache(async (username: string): Promise<UserProfile | null> => {
  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      points: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          comments: true,
          ratings: true,
          collections: true,
          resources: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    points: user.points,
    createdAt: user.createdAt.toISOString(),
    followerCount: user._count.followers,
    followingCount: user._count.following,
    commentCount: user._count.comments,
    ratingCount: user._count.ratings,
    collectionCount: user._count.collections,
    resourceCount: user._count.resources,
  };
});

export const getUnreadCount = cache(async (userId: string): Promise<number> => {
  return db.message.count({ where: { userId, read: false } });
});

export type MessageItem = {
  id: string;
  type: "ALL" | "FOLLOW" | "MENTION" | "SYSTEM" | "PRIVATE";
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export async function listMessages(userId: string): Promise<MessageItem[]> {
  const messages = await db.message.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      read: true,
      createdAt: true,
    },
  });

  return messages.map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
  }));
}

export async function getUserComments(username: string) {
  const comments = await db.comment.findMany({
    where: { user: { username } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      content: true,
      createdAt: true,
      likeCount: true,
      game: { select: { slug: true, title: true, coverUrl: true } },
    },
  });

  return comments.map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() }));
}
