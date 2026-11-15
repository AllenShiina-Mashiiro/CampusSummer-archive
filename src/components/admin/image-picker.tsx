"use client";

import { useRef, useState } from "react";

import { ImageIcon, XIcon } from "@/components/icons";
import { fieldClass } from "@/components/settings-card";

/**
 * 单图选择器：既可粘贴 URL，也可直接上传。
 * 上传后写回隐藏字段，值就是最终存进数据库的地址。
 */
export function ImagePicker({
  name,
  label,
  hint,
  defaultValue = "",
  aspect = "aspect-[16/9]",
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  aspect?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

      if (data.ok && data.url) setValue(data.url);
      else setError(data.error ?? "上传失败");
    } catch {
      setError("上传失败，请检查网络");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-medium text-ink">
          {label}
          {hint && <span className="ml-1 text-[12.5px] text-faint">{hint}</span>}
        </span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[12.5px] text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong disabled:opacity-60"
        >
          <ImageIcon size={13} />
          {busy ? "上传中…" : "上传图片"}
        </button>
      </div>

      <div className="mt-1.5 flex items-start gap-3">
        {value ? (
          <div className="relative shrink-0 overflow-hidden rounded-lg border border-line">
            <img src={value} alt="" className={`${aspect} w-32 object-cover`} />
            <button
              type="button"
              onClick={() => setValue("")}
              aria-label="清除"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
            >
              <XIcon size={11} />
            </button>
          </div>
        ) : (
          <div
            className={`${aspect} flex w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-[12px] text-faint`}
          >
            暂无图片
          </div>
        )}

        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="/covers/xxx.svg 或上传"
          className={`${fieldClass} min-w-0 flex-1`}
        />
      </div>

      {error && <p className="mt-1.5 text-[12.5px] text-rose">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
