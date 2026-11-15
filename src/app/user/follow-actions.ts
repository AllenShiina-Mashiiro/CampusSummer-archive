"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

/** 关注 / 取消关注；以表单提交，便于无 JS 也能用 */
export async function toggleFollowAction(formData: FormData): Promise<void> {
  const me = await requireUser();

  const targetUsername = String(formData.get("username") ?? "").trim();
  if (!targetUsername) return;

  const target = await db.user.findUnique({
    where: { username: targetUsername },
    select: { id: true },
  });
  if (!target) redirect("/");

  // 不能关注自己
  if (target.id === me.id) redirect(`/user/${targetUsername}`);

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
    select: { followerId: true },
  });

  if (existing) {
    await db.follow.delete({
      where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
    });
    await notify({
      userId: target.id,
      type: "FOLLOW",
      title: `${me.displayName} 取消了对你的关注`,
      href: `/user/${targetUsername}`,
      actorId: me.id,
    });
  } else {
    await db.follow.create({ data: { followerId: me.id, followingId: target.id } });
    await notify({
      userId: target.id,
      type: "FOLLOW",
      title: `${me.displayName} 关注了你`,
      href: `/user/${targetUsername}`,
      actorId: me.id,
    });
  }

  revalidatePath(`/user/${targetUsername}`);
  redirect(`/user/${targetUsername}`);
}
