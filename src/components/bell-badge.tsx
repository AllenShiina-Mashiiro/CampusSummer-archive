import { markAllRead, unreadCount } from "@/lib/notify";

import { BellIcon } from "@/components/icons";
import Link from "next/link";

/** 顶栏铃铛：未读数角标 */
export async function BellBadge({ userId }: { userId: string }) {
  const count = await unreadCount(userId);

  return (
    <Link
      href="/message"
      aria-label={count > 0 ? `消息（${count} 条未读）` : "消息"}
      className="relative flex items-center text-ink-soft transition-colors hover:text-ink"
    >
      <BellIcon size={19} />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-semibold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

/** 进入消息页时全部标为已读 */
export async function MarkAllRead({ userId }: { userId: string }) {
  await markAllRead(userId);
  return null;
}
