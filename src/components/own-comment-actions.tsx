"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * 本人评论的「编辑 / 撤回」入口。
 *
 * 详情页是缓存组件、不能读 cookie，所以这里在挂载后向 /api/me 确认身份，
 * 只有本人内容才显示操作按钮。
 */
export function OwnCommentActions({
  commentId,
  authorId,
  content,
  slug,
}: {
  commentId: string;
  authorId: string;
  content: string;
  slug: string;
}) {
  const [mine, setMine] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [text, setText] = useState(content);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((response) => response.json())
      .then((data: { id?: string | null }) => {
        if (!cancelled) setMine(data.id === authorId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authorId]);

  if (!mine) return null;

  async function submit(action: "update" | "delete") {
    setBusy(true);
    const body = new FormData();
    body.append("commentId", commentId);
    body.append("slug", slug);
    if (action === "update") body.append("content", text);

    await fetch(action === "update" ? "/api/comment" : "/api/comment/delete", {
      method: "POST",
      body,
    });

    window.location.reload();
  }

  if (editing) {
    return (
      <div className="mt-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-primary/50"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => submit("update")}
            className="rounded-lg bg-primary px-3 py-1 text-[13px] font-medium text-white disabled:opacity-60"
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setText(content);
            }}
            className="rounded-lg border border-line px-3 py-1 text-[13px] text-ink-soft"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-faint">
        <button type="button" onClick={() => setEditing(true)} className="hover:text-ink">
          编辑
        </button>
        <span>·</span>
        <button type="button" onClick={() => setConfirmOpen(true)} className="hover:text-rose">
          撤回
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="确定撤回这条讨论？"
        description="撤回后该条讨论会从讨论版移除，无法恢复。"
        confirmText="确认撤回"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void submit("delete");
        }}
      />
    </>
  );
}
