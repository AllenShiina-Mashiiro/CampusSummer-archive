"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * 本人评分的「撤回」入口。
 * 详情页不能读会话，这里挂载后向 /api/me 确认身份。
 */
export function OwnRatingActions({
  ratingId,
  authorId,
  slug,
}: {
  ratingId: string;
  authorId: string;
  slug: string;
}) {
  const [mine, setMine] = useState(false);
  const [open, setOpen] = useState(false);
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

  async function withdraw() {
    setOpen(false);
    setBusy(true);
    const body = new FormData();
    body.append("ratingId", ratingId);
    body.append("slug", slug);
    await fetch("/api/rating/delete", { method: "POST", body });
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        className="text-[12.5px] text-faint transition-colors hover:text-rose"
      >
        撤回评分
      </button>

      <ConfirmDialog
        open={open}
        title="撤回这条评分？"
        description="撤回后该评分会从条目均分中移除，可以重新评分。"
        confirmText="确认撤回"
        onCancel={() => setOpen(false)}
        onConfirm={() => void withdraw()}
      />
    </>
  );
}
