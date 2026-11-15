"use client";

import Link from "next/link";
import { useState } from "react";

import { ChevronDownIcon, FolderIcon } from "@/components/icons";

type Group = { label: string; docs: { slug: string; title: string }[] };

/** 左侧文档树：分组可展开/收起，像编辑器里的项目树 */
export function DocTree({ groups, activeSlug }: { groups: Group[]; activeSlug?: string }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="mt-2 space-y-1">
      {groups.map((group) => {
        const open = !collapsed[group.label];
        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => setCollapsed((prev) => ({ ...prev, [group.label]: open }))}
              aria-expanded={open}
              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13.5px] font-medium text-muted transition-colors hover:bg-subtle hover:text-ink"
            >
              <ChevronDownIcon
                size={13}
                className={open ? "text-faint transition-transform" : "-rotate-90 text-faint transition-transform"}
              />
              <FolderIcon size={14} className="text-faint" />
              {group.label}
              <span className="ml-auto text-[12px] text-faint">{group.docs.length}</span>
            </button>

            {open && (
              <ul className="space-y-0.5 pb-1">
                {group.docs.map((doc) => (
                  <li key={doc.slug}>
                    <Link
                      href={`/docs/${doc.slug}`}
                      className={
                        doc.slug === activeSlug
                          ? "block truncate rounded-lg bg-subtle px-3 py-1.5 pl-8 text-[13.5px] font-medium text-ink"
                          : "block truncate rounded-lg px-3 py-1.5 pl-8 text-[13.5px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
                      }
                    >
                      {doc.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
