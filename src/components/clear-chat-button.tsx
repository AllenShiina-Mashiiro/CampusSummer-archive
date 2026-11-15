"use client";

import { useState } from "react";

import { clearConversationAction } from "@/app/message/dm-actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** 清空聊天记录：二次确认后提交 */
export function ClearChatButton({ conversationId }: { conversationId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line px-2.5 py-1 text-[12.5px] text-muted transition-colors hover:border-rose/40 hover:text-rose"
      >
        清空记录
      </button>

      <ConfirmDialog
        open={open}
        title="清空这段聊天记录？"
        description="双方的所有消息都会被删除，无法恢复；会话本身会保留。"
        confirmText="确认清空"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          const form = document.getElementById("clear-chat-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />

      <form id="clear-chat-form" action={clearConversationAction} className="hidden">
        <input type="hidden" name="conversationId" value={conversationId} />
      </form>
    </>
  );
}
