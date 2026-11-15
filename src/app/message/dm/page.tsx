import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import { AutoRefresh } from "@/components/auto-refresh";
import { BellIcon, MessageSquareIcon } from "@/components/icons";
import { TimeAgo } from "@/components/time-ago";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "私信", description: "一对一私信会话。" };

type Row = {
  id: string;
  status: string;
  lastMessageAt: Date;
  peerName: string;
  peerAvatar: string | null;
  peerUsername: string;
  lastBody: string | null;
};

export default function DmListPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "私聊消息" }]} />

      <div className="mt-4">
        <h1 className="text-[25px] font-semibold tracking-tight text-ink">消息</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          这是消息页面，第一次访问对应的页面会自动已读所有消息
        </p>
      </div>

      <AutoRefresh intervalMs={8000} />

      <Suspense fallback={<div className="mt-5 h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <DmList />
      </Suspense>
    </div>
  );
}

async function DmList() {
  const session = await getSession();
  if (!session) redirect("/login?next=/message/dm");

  const rows = await db.$queryRaw<Row[]>`
    SELECT c.id, c.status, c."lastMessageAt",
           u."displayName" AS "peerName", u."avatarUrl" AS "peerAvatar", u.username AS "peerUsername",
           (SELECT m.body FROM "DirectMessage" m WHERE m."conversationId" = c.id
            ORDER BY m."createdAt" DESC LIMIT 1) AS "lastBody"
    FROM "Conversation" c
    JOIN "User" u ON u.id = CASE WHEN c."aId" = ${session.id} THEN c."bId" ELSE c."aId" END
    WHERE c."aId" = ${session.id} OR c."bId" = ${session.id}
    ORDER BY c."lastMessageAt" DESC
    LIMIT 50
  `;

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-line bg-surface p-2">
        <Link
          href="/message"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[14.5px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
        >
          <BellIcon size={16} />
          消息
        </Link>
        <Link
          href="/message/dm"
          className="mt-0.5 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-[14.5px] font-medium text-primary-strong"
        >
          <MessageSquareIcon size={16} />
          私信
        </Link>
      </aside>

      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-[16px] font-semibold text-ink">私信会话</p>
          <span className="text-[13px] text-faint">{rows.length} 个</span>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-[14px] text-muted">暂无私聊会话，您可以在其他用户的主页发起私聊</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/message/dm/${row.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-subtle"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[14px] font-semibold text-white">
                    {row.peerAvatar ? (
                      <img src={row.peerAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      row.peerName.slice(0, 1)
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14.5px] font-medium text-ink">{row.peerName}</span>
                      {row.status === "PENDING" && (
                        <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11.5px] text-primary-strong">
                          待接受
                        </span>
                      )}
                      {row.status === "REJECTED" && (
                        <span className="rounded-md bg-subtle px-1.5 py-0.5 text-[11.5px] text-muted">
                          已拒收
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-muted">
                      {row.lastBody ?? "还没有消息"}
                    </span>
                  </span>

                  <span className="shrink-0 text-[12.5px] text-faint">
                    <TimeAgo value={row.lastMessageAt.toISOString()} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
