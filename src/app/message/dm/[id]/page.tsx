import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { respondConversationAction, sendMessageAction } from "@/app/message/dm-actions";
import { Breadcrumb } from "@/components/breadcrumb";
import { AutoRefresh } from "@/components/auto-refresh";
import { ClearChatButton } from "@/components/clear-chat-button";
import { TimeAgo } from "@/components/time-ago";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "私信", robots: { index: false } };

type Conversation = {
  id: string;
  aId: string;
  bId: string;
  status: string;
  peerId: string;
  peerName: string;
  peerAvatar: string | null;
  peerUsername: string;
};

type DmRow = { id: string; senderId: string; body: string; createdAt: Date };

export default function DmChatPage({ params, searchParams }: PageProps<"/message/dm/[id]">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ href: "/message/dm", label: "私信" }, { label: "会话" }]} />

      <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-2xl bg-subtle" />}>
        <Chat params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Chat({
  params,
  searchParams,
}: {
  params: PageProps<"/message/dm/[id]">["params"];
  searchParams: PageProps<"/message/dm/[id]">["searchParams"];
}) {
  const session = await getSession();
  const [{ id }, raw] = await Promise.all([params, searchParams]);
  if (!session) redirect(`/login?next=/message/dm/${id}`);

  const rows = await db.$queryRaw<Conversation[]>`
    SELECT c.id, c."aId", c."bId", c.status,
           u.id AS "peerId", u."displayName" AS "peerName", u."avatarUrl" AS "peerAvatar", u.username AS "peerUsername"
    FROM "Conversation" c
    JOIN "User" u ON u.id = CASE WHEN c."aId" = ${session.id} THEN c."bId" ELSE c."aId" END
    WHERE c.id = ${id} AND (c."aId" = ${session.id} OR c."bId" = ${session.id})
    LIMIT 1
  `;

  const conversation = rows[0];
  if (!conversation) notFound();

  const messages = await db.$queryRaw<DmRow[]>`
    SELECT id, "senderId", body, "createdAt" FROM "DirectMessage"
    WHERE "conversationId" = ${id} ORDER BY "createdAt" ASC LIMIT 200
  `;

  const error = typeof raw?.error === "string" ? raw.error : "";
  const isRecipient = conversation.bId === session.id;
  const myTurnBlocked =
    conversation.status === "PENDING" && !isRecipient && messages.some((m) => m.senderId === session.id);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
      <AutoRefresh intervalMs={4000} />
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[14px] font-semibold text-white">
          {conversation.peerAvatar ? (
            <img src={conversation.peerAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            conversation.peerName.slice(0, 1)
          )}
        </span>
        <div>
          <Link
            href={`/user/${conversation.peerUsername}`}
            className="text-[15px] font-medium text-ink hover:text-primary-strong hover:underline"
          >
            {conversation.peerName}
          </Link>
          <p className="text-[12.5px] text-faint">
            {conversation.status === "ACCEPTED"
              ? "已建立会话"
              : conversation.status === "REJECTED"
                ? "对方已拒收私信"
                : isRecipient
                  ? "对方发来一条私信请求"
                  : "私信请求已发出，等待对方接受"}
          </p>
        </div>

        <div className="ml-auto">
          <ClearChatButton conversationId={conversation.id} />
        </div>
      </div>

      {error === "pending" && (
        <p className="border-b border-line bg-subtle px-5 py-2 text-[13.5px] text-muted">
          对方接受前只能发送一条消息
        </p>
      )}
      {error === "rejected" && (
        <p className="border-b border-line bg-rose-soft px-5 py-2 text-[13.5px] text-rose">
          对方已拒收私信，无法继续发送
        </p>
      )}

      {conversation.status === "PENDING" && isRecipient && (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-primary-soft/40 px-5 py-3">
          <p className="text-[13.5px] text-ink-soft">接受后即可自由聊天，拒收则对方无法再发送</p>
          <div className="flex items-center gap-2">
            <form action={respondConversationAction}>
              <input type="hidden" name="conversationId" value={id} />
              <input type="hidden" name="decision" value="reject" />
              <button
                type="submit"
                className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink"
              >
                拒收
              </button>
            </form>
            <form action={respondConversationAction}>
              <input type="hidden" name="conversationId" value={id} />
              <input type="hidden" name="decision" value="accept" />
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-strong"
              >
                接受
              </button>
            </form>
          </div>
        </div>
      )}

      <ul className="max-h-[52vh] space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <li className="py-10 text-center text-[14px] text-muted">还没有消息</li>
        )}

        {messages.map((message) => {
          const mine = message.senderId === session.id;

          return (
            <li key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div
                  className={
                    mine
                      ? "rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[14px] leading-relaxed text-white"
                      : "rounded-2xl rounded-bl-md bg-subtle px-3.5 py-2 text-[14px] leading-relaxed text-ink"
                  }
                >
                  {message.body}
                </div>
                <p className={`mt-1 text-[12px] text-faint ${mine ? "text-right" : ""}`}>
                  {message.createdAt.toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <form action={sendMessageAction} className="flex items-center gap-2 border-t border-line px-5 py-3">
        <input type="hidden" name="toUserId" value={conversation.peerId} />
        <input
          name="body"
          required
          maxLength={1000}
          disabled={myTurnBlocked || conversation.status === "REJECTED"}
          placeholder={
            conversation.status === "REJECTED"
              ? "对方已拒收私信"
              : myTurnBlocked
                ? "等待对方接受后才能继续发送"
                : "说点什么…"
          }
          className="flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none placeholder:text-faint focus:border-primary/50 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={myTurnBlocked || conversation.status === "REJECTED"}
          className="rounded-xl bg-primary px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </div>
  );
}
