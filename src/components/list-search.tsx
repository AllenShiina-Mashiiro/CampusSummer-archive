import { SearchIcon } from "@/components/icons";

/** 列表页的搜索框：纯 HTML form，回车即请求，服务端按 ?q= 过滤 */
export function ListSearch({
  action,
  placeholder,
  defaultValue,
}: {
  action: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <form action={action} className="relative">
      <label htmlFor="list-search" className="sr-only">
        搜索
      </label>
      <input
        id="list-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-transparent bg-subtle pl-4 pr-11 text-[14.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-primary/40 focus:bg-surface"
      />
      <button
        type="submit"
        aria-label="搜索"
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:text-ink"
      >
        <SearchIcon size={17} />
      </button>
    </form>
  );
}
