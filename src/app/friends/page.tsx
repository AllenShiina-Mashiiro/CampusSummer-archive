import type { Metadata } from "next";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import { ExternalLinkIcon } from "@/components/icons";
import { getFriendLinks } from "@/lib/friends";

export const metadata: Metadata = {
  title: "友情链接",
  description: "本站的友站列表，点击即可访问。",
};

export default function FriendsPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "友情链接" }]} />

      <div className="mt-6 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">友情链接</h1>
        <p className="mt-2 text-[14px] text-muted">下方是我们的友站，您可以点击以访问这些网站</p>
      </div>

      <Suspense fallback={<div className="mt-6 h-40 animate-pulse rounded-2xl bg-subtle" />}>
        <FriendList />
      </Suspense>
    </div>
  );
}

async function FriendList() {
  const friends = await getFriendLinks();

  if (friends.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-line bg-surface py-16 text-center text-[14px] text-muted">
        站长还没有添加友情链接。
      </p>
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {friends.map((friend) => (
        <li key={friend.id}>
          <a
            href={friend.url}
            target={friend.url.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="card-hover flex h-full flex-col rounded-2xl border border-line bg-surface px-5 py-6 text-center"
          >
            {friend.imageUrl ? (
              <img
                src={friend.imageUrl}
                alt=""
                className="mx-auto h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bfdbfe] to-[#6366f1] text-[23px] font-semibold text-white">
                {friend.title.slice(0, 1)}
              </span>
            )}

            <span className="mt-4 flex items-center justify-center gap-1 text-[16px] font-semibold text-ink">
              {friend.title}
              <ExternalLinkIcon size={12} className="text-faint" />
            </span>

            {friend.description && (
              <span className="mt-2 text-[13.5px] leading-relaxed text-muted">
                {friend.description}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
