"use client";

import Link from "next/link";
import { useState } from "react";

import { UserIcon, UsersIcon, XIcon } from "@/components/icons";

export type FollowUser = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

/** 主页的「粉丝 / 关注」入口：点击弹出小列表 */
export function FollowStats({
  followers,
  following,
  followerCount,
  followingCount,
}: {
  followers: FollowUser[];
  following: FollowUser[];
  followerCount: number;
  followingCount: number;
}) {
  const [open, setOpen] = useState<null | "followers" | "following">(null);
  const list = open === "followers" ? followers : following;

  return (
    <>
      <div className="mt-4 flex items-center justify-center gap-6 text-[13.5px] text-muted">
        <button
          type="button"
          onClick={() => setOpen("followers")}
          className="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors hover:bg-subtle hover:text-ink"
        >
          <UsersIcon size={13} />
          {followerCount} 人关注 TA
        </button>

        <button
          type="button"
          onClick={() => setOpen("following")}
          className="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors hover:bg-subtle hover:text-ink"
        >
          <UserIcon size={13} />
          {followingCount} 正在关注
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(null);
          }}
        >
          <div className="max-h-[70vh] w-full max-w-[360px] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[15px] font-semibold text-ink">
                {open === "followers" ? "关注 TA 的人" : "TA 正在关注"}
                <span className="ml-1.5 text-[13px] font-normal text-faint">
                  {open === "followers" ? followerCount : followingCount}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="关闭"
                className="text-faint transition-colors hover:text-ink"
              >
                <XIcon size={15} />
              </button>
            </div>

            <ul className="max-h-[52vh] overflow-y-auto">
              {list.length === 0 && (
                <li className="px-4 py-10 text-center text-[14px] text-muted">
                  {open === "followers" ? "还没有人关注" : "还没有关注任何人"}
                </li>
              )}

              {list.map((user) => (
                <li key={user.username}>
                  <Link
                    href={`/user/${user.username}`}
                    onClick={() => setOpen(null)}
                    className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-subtle"
                  >
                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[13px] font-semibold text-white">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        user.displayName.slice(0, 1)
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium text-ink">
                        {user.displayName}
                      </span>
                      <span className="block truncate text-[12.5px] text-faint">@{user.username}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
