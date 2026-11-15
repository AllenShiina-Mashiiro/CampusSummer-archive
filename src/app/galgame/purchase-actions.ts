"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

/** 增删「支持正版」链接；创作者及以上可编辑任意条目 */
export async function addPurchaseLinkAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  if (!can(me.role, "game.publish")) redirect("/");

  const gameId = String(formData.get("gameId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || "官方商店";
  const note = String(formData.get("note") ?? "").trim() || null;
  const back = String(formData.get("back") ?? "/creator");

  if (!gameId || !url) redirect(`${back}/games/${gameId}`);

  await db.$executeRaw`
    INSERT INTO "PurchaseLink" (id, "gameId", label, url, note, "createdAt")
    VALUES (${randomUUID()}, ${gameId}, ${label.slice(0, 40)}, ${url.slice(0, 500)}, ${note}, NOW())
  `;

  revalidatePath(`/galgame`);
  revalidatePath(`${back}/games/${gameId}`);
  redirect(`${back}/games/${gameId}`);
}

export async function deletePurchaseLinkAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  if (!can(me.role, "game.publish")) redirect("/");

  const id = String(formData.get("id") ?? "");
  const gameId = String(formData.get("gameId") ?? "");
  const back = String(formData.get("back") ?? "/creator");

  if (id) await db.$executeRaw`DELETE FROM "PurchaseLink" WHERE id = ${id}`;

  revalidatePath(`${back}/games/${gameId}`);
  redirect(`${back}/games/${gameId}`);
}
