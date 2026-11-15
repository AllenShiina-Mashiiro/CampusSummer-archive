import { cacheLife, cacheTag } from "next/cache";

import { db } from "./db";

/** 友情链接：数据全部来自后台「网站设置」，不再使用写死的示例数据。 */
export type FriendLink = {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  sortOrder: number;
};

export async function getFriendLinks(): Promise<FriendLink[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("friends");

  return db.friendLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      url: true,
      imageUrl: true,
      sortOrder: true,
    },
  });
}
