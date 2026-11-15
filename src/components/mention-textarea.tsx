"use client";

import { useEffect, useRef, useState } from "react";

type Candidate = { username: string; displayName: string; avatarUrl: string | null };

/**
 * 讨论输入框：输入 @ 时弹出用户联想（类似 bilibili）。
 *
 * 选中后把 `@用户名 ` 插入光标处；表单提交的仍是普通文本，
 * 服务端已有解析 @ 的逻辑，无需额外协议。
 */
export function MentionTextarea({
  name = "content",
  placeholder,
  rows = 3,
  required = true,
}: {
  name?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  const [value, setValue] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);
  const queryRef = useRef("");

  // 取光标前的 @关键词
  function currentQuery(text: string, caret: number): string | null {
    const before = text.slice(0, caret);
    const match = /@([\w-]{0,20})$/.exec(before);
    return match ? match[1] : null;
  }

  useEffect(() => {
    if (!open || !queryRef.current) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(queryRef.current)}`, {
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((data: { users?: Candidate[] }) => {
          setCandidates(data.users ?? []);
          setActive(0);
        })
        .catch(() => {});
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, value]);

  function onChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value;
    setValue(text);

    const caret = event.target.selectionStart ?? text.length;
    const query = currentQuery(text, caret);
    queryRef.current = query ?? "";

    if (query === null) {
      setOpen(false);
      setCandidates([]);
      return;
    }

    setOpen(true);
  }

  function pick(candidate: Candidate) {
    const node = ref.current;
    if (!node) return;

    const caret = node.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const start = before.lastIndexOf("@");
    const next = `${value.slice(0, start)}@${candidate.username} ${value.slice(caret)}`;

    setValue(next);
    setOpen(false);
    setCandidates([]);

    requestAnimationFrame(() => {
      node.focus();
      const position = start + candidate.username.length + 2;
      node.setSelectionRange(position, position);
    });
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={(event) => {
          if (!open || candidates.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => (index + 1) % candidates.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => (index - 1 + candidates.length) % candidates.length);
          } else if (event.key === "Enter") {
            event.preventDefault();
            pick(candidates[active]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        rows={rows}
        required={required}
        maxLength={1000}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-[14.5px] text-ink outline-none placeholder:text-faint focus:border-primary/50"
      />

      {open && candidates.length > 0 && (
        <ul className="absolute left-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          {candidates.map((candidate, index) => (
            <li key={candidate.username}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(candidate);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                  index === active ? "bg-primary-soft" : "hover:bg-subtle"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-primary text-[10px] font-semibold text-white">
                  {candidate.avatarUrl ? (
                    <img src={candidate.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    candidate.displayName.slice(0, 1)
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] text-ink">{candidate.displayName}</span>
                  <span className="block truncate text-[12px] text-faint">@{candidate.username}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
