"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

type ConversationRow = {
  id: string;
  aId: string;
  bId: string;
  status: string;
};

/** 找到两人之间的会话（无序），没有就创建 */
async function ensureConversation(meId: string, otherId: string): Promise<ConversationRow> {
  const existing = await db.$queryRaw<ConversationRow[]>`
    SELECT id, "aId", "bId", status FROM "Conversation"
    WHERE ("aId" = ${meId} AND "bId" = ${otherId}) OR ("aId" = ${otherId} AND "bId" = ${meId})
    LIMIT 1
  `;
  if (existing.length > 0) return existing[0];

  const id = randomUUID();
  await db.$executeRaw`
    INSERT INTO "Conversation" (id, "aId", "bId", status, "lastMessageAt", "createdAt")
    VALUES (${id}, ${meId}, ${otherId}, 'PENDING', NOW(), NOW())
  `;
  return { id, aId: meId, bId: otherId, status: "PENDING" };
}

/** 清空某会话的聊天记录（仅参与者可操作） */
export async function clearConversationAction(formData: FormData): Promise<void> {
  const me = await requireUser();

  const conversationId = String(formData.get("conversationId") ?? "");
  if (!conversationId) redirect("/message/dm");

  const rows = await db.$queryRaw<ConversationRow[]>`
    SELECT id, "aId", "bId", status FROM "Conversation" WHERE id = ${conversationId} LIMIT 1
  `;
  const conversation = rows[0];
  if (!conversation) redirect("/message/dm");
  if (conversation.aId !== me.id && conversation.bId !== me.id) redirect("/message/dm");

  await db.$executeRaw`DELETE FROM "DirectMessage" WHERE "conversationId" = ${conversationId}`;
  await db.$executeRaw`UPDATE "Conversation" SET "lastMessageAt" = NOW() WHERE id = ${conversationId}`;

  revalidatePath(`/message/dm/${conversationId}`);
  redirect(`/message/dm/${conversationId}`);
}

/** 在用户主页发起私信：建会话并跳到聊天页 */
export async function startConversationAction(formData: FormData): Promise<void> {
  const me = await requireUser();

  const otherId = String(formData.get("toUserId") ?? "");
  if (!otherId || otherId === me.id) redirect("/");

  const conversation = await ensureConversation(me.id, otherId);
  redirect(`/message/dm/${conversation.id}`);
}

/** 发送私信；首次发送即为「请求」，对方接受前只能发一条 */
export async function sendMessageAction(formData: FormData): Promise<void> {
  const me = await requireUser();

  const otherId = String(formData.get("toUserId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!otherId || !body) redirect("/message/dm");
  if (otherId === me.id) redirect("/message/dm");

  const conversation = await ensureConversation(me.id, otherId);

  if (conversation.status === "REJECTED") {
    redirect(`/message/dm/${conversation.id}?error=rejected`);
  }

  if (conversation.status === "PENDING") {
    // 未接受前：只有发起方可以发一条
    const mine = await db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "DirectMessage"
      WHERE "conversationId" = ${conversation.id} AND "senderId" = ${me.id}
    `;
    if (Number(mine[0]?.count ?? 0) >= 1) {
      redirect(`/message/dm/${conversation.id}?error=pending`);
    }
  }

  await db.$executeRaw`
    INSERT INTO "DirectMessage" (id, "conversationId", "senderId", body, "createdAt")
    VALUES (${randomUUID()}, ${conversation.id}, ${me.id}, ${body.slice(0, 1000)}, NOW())
  `;
  await db.$executeRaw`
    UPDATE "Conversation" SET "lastMessageAt" = NOW() WHERE id = ${conversation.id}
  `;

  await notify({
    userId: otherId,
    type: "PRIVATE",
    title: `${me.displayName} 给你发了私信`,
    body: body.slice(0, 60),
    href: `/message/dm/${conversation.id}`,
    actorId: me.id,
  });

  revalidatePath(`/message/dm/${conversation.id}`);
  redirect(`/message/dm/${conversation.id}`);
}

/** 接受 / 拒收私信请求 */
export async function respondConversationAction(formData: FormData): Promise<void> {
  const me = await requireUser();

  const conversationId = String(formData.get("conversationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!conversationId || !["accept", "reject"].includes(decision)) redirect("/message/dm");

  const rows = await db.$queryRaw<ConversationRow[]>`
    SELECT id, "aId", "bId", status FROM "Conversation" WHERE id = ${conversationId} LIMIT 1
  `;
  const conversation = rows[0];
  if (!conversation) redirect("/message/dm");

  // 只有接收方（bId）可以处理
  if (conversation.bId !== me.id) redirect(`/message/dm/${conversationId}`);

  await db.$executeRaw`
    UPDATE "Conversation" SET status = ${decision === "accept" ? "ACCEPTED" : "REJECTED"}
    WHERE id = ${conversationId}
  `;

  await notify({
    userId: conversation.aId,
    type: "PRIVATE",
    title: decision === "accept" ? `${me.displayName} 接受了你的私信请求` : `${me.displayName} 拒绝了你的私信请求`,
    href: `/message/dm/${conversationId}`,
    actorId: me.id,
  });

  revalidatePath(`/message/dm/${conversationId}`);
  redirect(`/message/dm/${conversationId}`);
}
