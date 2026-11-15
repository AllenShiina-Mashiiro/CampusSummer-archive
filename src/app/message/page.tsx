import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import { AutoRefresh } from "@/components/auto-refresh";
import { BellIcon, CommentIcon, MessageSquareIcon } from "@/components/icons";
import { TimeAgo } from "@/components/time-ago";
import { getSession } from "@/lib/auth";
import { listNotifications, markAllRead } from "@/lib/notify";

export const metadata: Metadata = {
  title: "消息",
  description: "系统通知、公告、关注与 @ 提及。",
};

const TYPE_LABEL: Record<string, { label: string; icon: React.ReactNode }> = {
  SYSTEM: { label: "系统", icon: <BellIcon size={15} /> },
  ANNOUNCE: { label: "公告", icon: <MessageSquareIcon size={15} /> },
  DOC: { label: "文档", icon: <MessageSquareIcon size={15} /> },
  FOLLOW: { label: "关注", icon: <BellIcon size={15} /> },
  MENTION: { label: "提到我", icon: <CommentIcon size={15} /> },
  PRIVATE: { label: "私信", icon: <MessageSquareIcon size={15} /> },
};

export default function MessagePage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "私聊消息" }]} />

      <div className="mt-4">
        <h1 className="text-[25px] font-semibold tracking-tight text-ink">消息</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          进入本页会自动将消息标记为已读。
        </p>
      </div>

      <AutoRefresh intervalMs={8000} />

      <Suspense fallback={<div className="mt-5 h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <MessageView />
      </Suspense>
    </div>
  );
}

async function MessageView() {
  const session = await getSession();
  if (!session) redirect("/login?next=/message");

  const notifications = await listNotifications(session.id, 60);
  await markAllRead(session.id);

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-line bg-surface p-2">
        <Link
          href="/message"
          className="flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-[14.5px] font-medium text-primary-strong"
        >
          <BellIcon size={16} />
          消息
        </Link>
        <Link
          href="/message/dm"
          className="mt-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-[14.5px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
        >
          <MessageSquareIcon size={16} />
          私信
        </Link>
      </aside>

      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-[16px] font-semibold text-ink">全部消息</p>
          <span className="text-[13px] text-faint">{notifications.length} 条</span>
        </div>

        {notifications.length === 0 ? (
          <p className="px-5 py-16 text-center text-[14px] text-muted">
            暂无消息，发布文档、被关注或收到 @ 时会出现在这里
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {notifications.map((item) => {
              const meta = TYPE_LABEL[item.type] ?? TYPE_LABEL.SYSTEM;

              return (
                <li key={item.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle text-muted">
                      {item.actorAvatar ? (
                        <img src={item.actorAvatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        meta.icon
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[14.5px] text-ink">
                        {item.href ? (
                          <Link href={item.href} className="hover:text-primary-strong hover:underline">
                            {item.title}
                          </Link>
                        ) : (
                          item.title
                        )}
                        <span className="rounded-md bg-subtle px-1.5 py-0.5 text-[12px] text-muted">
                          {meta.label}
                        </span>
                        {!item.read && (
                          <span className="rounded-full bg-rose px-1.5 py-0.5 text-[10px] text-white">
                            新
                          </span>
                        )}
                      </p>

                      {item.body && (
                        <p className="mt-1 line-clamp-2 text-[13.5px] text-muted">{item.body}</p>
                      )}

                      <p className="mt-1 text-[12.5px] text-faint">
                        <TimeAgo value={item.createdAt.toISOString()} />
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
