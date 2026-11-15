"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { storeUpload } from "@/lib/media";
import { extensionFor, MAX_UPLOAD_BYTES } from "@/lib/storage";
import {
  NICKNAME_MAX,
  normalizeNickname,
  USERNAME_MAX,
  USERNAME_PATTERN,
  USERNAME_RULE_TEXT,
} from "@/lib/user-fields";

export type ActionResult = { ok: boolean; message?: string };

/* ---------------------------- 资料 / 密码 ---------------------------- */

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();

  const displayName = normalizeNickname(String(formData.get("displayName") ?? ""));
  const username = String(formData.get("username") ?? "").trim();
  const signature = String(formData.get("signature") ?? "").trim().slice(0, 100);
  const avatar = formData.get("avatar");

  if (!displayName) return { ok: false, message: "昵称不能为空" };
  if (displayName.length > NICKNAME_MAX) {
    return { ok: false, message: `昵称最长 ${NICKNAME_MAX} 个字符` };
  }
  if (!username) return { ok: false, message: "用户名不能为空" };
  if (username.length > USERNAME_MAX) {
    return { ok: false, message: `用户名最长 ${USERNAME_MAX} 个字符` };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, message: USERNAME_RULE_TEXT };
  }

  const clash = await db.user.findFirst({
    where: { username, id: { not: session.id } },
    select: { id: true },
  });
  if (clash) return { ok: false, message: "这个用户名已经被占用了" };

  let avatarUrl: string | null = null;

  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > MAX_UPLOAD_BYTES) {
      return { ok: false, message: "头像不能超过 8MB" };
    }

    const extension = extensionFor(avatar.type);
    if (!extension) {
      return { ok: false, message: "头像格式只支持 PNG / JPEG / WebP / GIF / AVIF" };
    }

    const stored = await storeUpload(
      Buffer.from(await avatar.arrayBuffer()),
      avatar.type,
      avatar.name || `avatar.${extension}`,
      session.id,
    );
    avatarUrl = stored.url;
  }

  await db.user.update({
    where: { id: session.id },
    data: {
      username,
      displayName,
      bio: signature || null,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/settings/profile");
  revalidatePath(`/user/${username}`);
  return { ok: true, message: "资料已保存" };
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!current || !next) return { ok: false, message: "请填写完整" };
  if (next.length < 6) return { ok: false, message: "新密码至少 6 位" };
  if (next !== confirm) return { ok: false, message: "两次输入的新密码不一致" };

  const bcrypt = (await import("bcryptjs")).default;
  const user = await db.user.findUnique({ where: { id: session.id }, select: { passwordHash: true } });
  if (!user) return { ok: false, message: "用户不存在" };

  const matched = await bcrypt.compare(current, user.passwordHash);
  if (!matched) return { ok: false, message: "当前密码不正确" };

  await db.user.update({
    where: { id: session.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });

  return { ok: true, message: "密码已更新" };
}

/* ---------------------------- 内容控制 ---------------------------- */

export async function blockTagAction(formData: FormData): Promise<void> {
  await toggleBlockedTagAction(formData);
}

/** 内容控制：屏蔽 / 取消屏蔽某个标签 */
export async function toggleBlockedTagAction(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();
  const tagId = String(formData.get("tagId") ?? "");
  const intent = String(formData.get("intent") ?? "block");

  if (!tagId) return { ok: false, message: "缺少标签" };

  if (intent === "unblock") {
    await db.blockedTag.deleteMany({ where: { userId: session.id, tagId } });
  } else {
    await db.blockedTag.upsert({
      where: { userId_tagId: { userId: session.id, tagId } },
      create: { userId: session.id, tagId },
      update: {},
    });
  }

  revalidatePath("/settings/content");
  return { ok: true };
}

/** 内容控制：屏蔽 / 取消屏蔽某个条目 */
export async function toggleBlockedGameAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const gameId = String(formData.get("gameId") ?? "");
  const intent = String(formData.get("intent") ?? "block");

  if (!gameId) redirect("/settings/content");

  if (intent === "unblock") {
    await db.$executeRaw`
      DELETE FROM "BlockedGame" WHERE "userId" = ${session.id} AND "gameId" = ${gameId}
    `;
  } else {
    await db.$executeRaw`
      INSERT INTO "BlockedGame" ("userId","gameId") VALUES (${session.id}, ${gameId})
      ON CONFLICT DO NOTHING
    `;
  }

  revalidatePath("/settings/content");
  revalidatePath("/galgame");
  revalidatePath("/");
  redirect("/settings/content");
}

/* ------------------------- 表单入口：带结果回跳 ------------------------- */

function backTo(path: string, result: ActionResult): never {
  const key = result.ok ? "ok" : "err";
  redirect(`${path}?${key}=${encodeURIComponent(result.message ?? "已保存")}`);
}

export async function submitProfile(formData: FormData): Promise<never> {
  const result = await updateProfileAction(formData);
  backTo("/settings/profile", result);
}

export async function submitPassword(formData: FormData): Promise<never> {
  const result = await changePasswordAction(formData);
  backTo("/settings/security", result);
}
