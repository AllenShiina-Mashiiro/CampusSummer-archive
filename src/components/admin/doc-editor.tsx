"use client";

import { useRef, useState } from "react";

import { saveDocAction } from "@/app/admin/doc-actions";
import { ImagePicker } from "@/components/admin/image-picker";
import { ImageIcon } from "@/components/icons";
import { fieldClass } from "@/components/settings-card";

export type DocValues = {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string | null;
  content?: string;
  category?: string;
  coverUrl?: string | null;
};

const CATEGORIES = [
  { value: "NOTICE", label: "公告" },
  { value: "GUIDE", label: "使用指南" },
  { value: "POLICY", label: "协议与政策" },
  { value: "ABOUT", label: "关于项目" },
];

/**
 * 文档编辑器：标题/分类/简介/背景图 + Markdown 正文。
 * 「插入图片」会先上传再在光标处插入 Markdown 语法，发布后即渲染成图。
 */
export function DocEditor({ values }: { values?: DocValues }) {
  const [content, setContent] = useState(values?.content ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function insertImage(event: React.ChangeEvent<HTMLInputElement>) {
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

      if (!data.ok || !data.url) {
        setError(data.error ?? "上传失败");
        return;
      }

      const markdown = `![${file.name.replace(/\.[^.]+$/, "")}](${data.url})`;
      const node = textareaRef.current;
      if (!node) {
        setContent((prev) => `${prev}\n${markdown}\n`);
        return;
      }

      const start = node.selectionStart ?? content.length;
      const next = `${content.slice(0, start)}${markdown}${content.slice(start)}`;
      setContent(next);

      requestAnimationFrame(() => {
        node.focus();
        const caret = start + markdown.length;
        node.setSelectionRange(caret, caret);
      });
    } catch {
      setError("上传失败，请检查网络");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={saveDocAction} className="space-y-3">
      {values?.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="title"
          required
          defaultValue={values?.title}
          placeholder="标题（必填）"
          className={fieldClass}
        />
        <select name="category" defaultValue={values?.category ?? "GUIDE"} className={fieldClass}>
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <input
        name="summary"
        defaultValue={values?.summary ?? ""}
        placeholder="简介（可选，用于卡片与列表）"
        className={fieldClass}
      />
      <ImagePicker
        name="coverUrl"
        label="背景图"
        hint="可选，显示在文档卡片顶部"
        defaultValue={values?.coverUrl}
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[13.5px] font-medium text-ink">正文（Markdown）</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[13px] text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong disabled:opacity-60"
          >
            <ImageIcon size={14} />
            {busy ? "上传中…" : "插入图片"}
          </button>
        </div>

        <textarea
          ref={textareaRef}
          name="content"
          rows={14}
          required
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={"## 小标题\n- 列表项\n\n也可以点右上角「插入图片」直接上传并插入"}
          className={`${fieldClass} resize-y font-mono text-[13.5px]`}
        />

        {error && <p className="mt-1.5 text-[12.5px] text-rose">{error}</p>}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          onChange={insertImage}
          className="hidden"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <a
          href="/admin/docs"
          className="rounded-xl border border-line px-4 py-2 text-[14px] text-ink-soft transition-colors hover:text-ink"
        >
          取消
        </a>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
        >
          {values?.id ? "保存修改" : "发布"}
        </button>
      </div>
    </form>
  );
}
