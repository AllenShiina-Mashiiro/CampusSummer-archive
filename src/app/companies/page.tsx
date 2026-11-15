import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumb, PageHeading } from "@/components/breadcrumb";
import { ListSearch } from "@/components/list-search";
import { listCompanies, type CompanyListItem } from "@/lib/taxonomy";

export const metadata = {
  title: "游戏会社",
  description: "本站收录的开发会社与制作组，含别名、主语言与官网入口。",
};

export default function CompaniesPage({ searchParams }: PageProps<"/companies">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "游戏会社" }]} />

      <div className="mt-4">
        <PageHeading
          title="会社列表"
          description="这里收录本站游戏条目涉及的全部会社，点击卡片查看该会社的作品。"
        />
      </div>

      <div className="mt-5">
        <Suspense fallback={<div className="h-11 rounded-xl bg-subtle" />}>
          <SearchArea searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense fallback={<CompanyGridSkeleton />}>
        <CompanyGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchArea({ searchParams }: { searchParams: PageProps<"/companies">["searchParams"] }) {
  const params = (await searchParams) ?? {};
  const q = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <ListSearch
      action="/companies"
      placeholder="搜索会社名称或别名"
      defaultValue={q ?? ""}
    />
  );
}

async function CompanyGrid({ searchParams }: { searchParams: PageProps<"/companies">["searchParams"] }) {
  const params = (await searchParams) ?? {};
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const companies = await listCompanies(q);

  if (companies.length === 0) {
    return (
      <p className="py-16 text-center text-[14.5px] text-muted">没有匹配的会社，试试其他关键字。</p>
    );
  }

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <CompanyCard key={company.slug} company={company} />
      ))}
    </div>
  );
}

function CompanyCard({ company }: { company: CompanyListItem }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className={`card-hover block rounded-full border px-6 py-4 ${cardColor(company.name)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[18px] font-bold tracking-tight text-ink">{company.name}</span>
        <span className="shrink-0 rounded-full bg-surface/80 px-2.5 py-1 text-[13px] text-muted">
          {company.count} 个游戏
        </span>
      </div>

      {company.aliases.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {company.aliases.slice(0, 4).map((alias) => (
            <span
              key={alias}
              className={`rounded-full px-2.5 py-1 text-[12.5px] font-medium ${chipColor(alias)}`}
            >
              {alias}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function CompanyGridSkeleton() {
  return (
    <div className="mt-5 grid animate-pulse grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-24 rounded-full bg-subtle" />
      ))}
    </div>
  );
}

/** 会社卡片配色：按名称哈希，稳定且各不相同 */
const CARD_PALETTE = [
  "border-violet/25 bg-violet-soft/60",
  "border-primary/25 bg-primary-soft/60",
  "border-mint/25 bg-mint-soft/60",
  "border-rose/20 bg-rose-soft/60",
  "border-[#b45309]/20 bg-[#fef3c7]/60",
  "border-[#4338ca]/20 bg-[#e0e7ff]/60",
  "border-[#0f766e]/20 bg-[#ccfbf1]/60",
  "border-[#be185d]/20 bg-[#fce7f3]/60",
];

function hashOf(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 0xffffffff;
  }
  return Math.abs(hash);
}

function cardColor(name: string): string {
  return CARD_PALETTE[hashOf(name) % CARD_PALETTE.length];
}

function chipColor(name: string): string {
  const chips = [
    "bg-violet-soft text-violet",
    "bg-primary-soft text-primary-strong",
    "bg-mint-soft text-mint",
    "bg-rose-soft text-rose",
    "bg-[#fef3c7] text-[#b45309]",
    "bg-[#e0e7ff] text-[#4338ca]",
    "bg-[#ccfbf1] text-[#0f766e]",
    "bg-[#fce7f3] text-[#be185d]",
  ];
  return chips[hashOf(name) % chips.length];
}
