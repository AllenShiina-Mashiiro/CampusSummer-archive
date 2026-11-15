import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getRandomGameSlug } from "@/lib/games";

/** 「随机一部游戏」：随机跳转到某个条目详情页；connection() 保证每次请求都重新抽 */
export async function GET() {
  await connection();

  const slug = await getRandomGameSlug();
  // 中文 slug 必须编码，否则 Location 头非法 → 500
  redirect(slug ? `/galgame/${encodeURIComponent(slug)}` : "/galgame");
}
