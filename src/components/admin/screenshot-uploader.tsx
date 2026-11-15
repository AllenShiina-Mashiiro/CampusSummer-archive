"use client";

import { useRef, useState } from "react";

import { PlusIcon, XIcon } from "@/components/icons";

const MAX = 3;

/** 游戏截图上传：最多 3 张，选图后立即上传并回填隐藏字段 */
export function ScreenshotUploader({ defaultValue = [] }: { defaultValue?: string[] }) {
  const [urls, setUrls] = useState<string[]>(defaultValue.slice(0, MAX));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = (await response.json()) as { ok: boolean; url?: string; error?: string };

      if (data.ok && data.url) {
        setUrls((prev) => [...prev, data.url as string].slice(0, MAX));
      } else {
        setError(data.error ?? "上传失败");
      }
    } catch {
      setError("上传失败，请检查网络");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="text-[13.5px] font-medium text-ink">
        游戏截图 <span className="ml-1 text-[12.5px] text-faint">最多 {MAX} 张</span>
      </span>

      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {urls.map((url) => (
          <div key={url} className="relative overflow-hidden rounded-lg border border-line">
            <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
            <button
              type="button"
              onClick={() => setUrls((prev) => prev.filter((item) => item !== url))}
              aria-label="移除截图"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
            >
              <XIcon size={11} />
            </button>
            <input type="hidden" name="screenshots" value={url} />
          </div>
        ))}

        {urls.length < MAX && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-[13px] text-muted transition-colors hover:border-primary/40 hover:text-primary-strong disabled:opacity-60"
          >
            <PlusIcon size={16} />
            {busy ? "上传中…" : "添加截图"}
          </button>
        )}
      </div>

      {error && <p className="mt-1.5 text-[12.5px] text-rose">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
