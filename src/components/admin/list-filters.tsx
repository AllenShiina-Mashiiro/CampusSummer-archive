import { SearchIcon } from "@/components/icons";

/**
 * 后台列表的检索 + 排序工具栏（纯 GET 表单，不需要客户端 JS）。
 * 各页面自己解析 searchParams 的 q / sort，这里只负责界面。
 */
export function ListFilters({
  basePath,
  query,
  sortKey,
  sorts,
  placeholder = "搜索…",
  total,
}: {
  basePath: string;
  query: string;
  sortKey: string;
  sorts: Record<string, string>;
  placeholder?: string;
  total?: number;
}) {
  return (
    <form
      action={basePath}
      className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5"
    >
      <span className="flex items-center gap-1.5 text-faint">
        <SearchIcon size={14} />
      </span>
      <input
        name="q"
        defaultValue={query}
        placeholder={placeholder}
        className="min-w-[180px] flex-1 rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13.5px] text-ink outline-none placeholder:text-faint focus:border-primary/40"
      />
      <select
        name="sort"
        defaultValue={sortKey}
        className="rounded-lg border border-line bg-surface px-2 py-1.5 text-[13.5px] text-ink-soft"
      >
        {Object.entries(sorts).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-primary px-3 py-1.5 text-[13.5px] font-medium text-white transition-colors hover:bg-primary-strong"
      >
        检索
      </button>
      {(query || sortKey !== Object.keys(sorts)[0]) && (
        <a href={basePath} className="text-[13px] text-muted hover:text-ink">
          清除
        </a>
      )}
      {typeof total === "number" && (
        <span className="ml-auto text-[13px] text-faint">共 {total} 条</span>
      )}
    </form>
  );
}
