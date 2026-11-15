import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/breadcrumb";
import { CompanyEditor } from "@/components/company-editor";
import { ExternalLinkIcon, GlobeIcon, LanguagesIcon, TagIcon } from "@/components/icons";
import { GameGrid } from "@/components/game-card";
import { getCompanyBySlug } from "@/lib/taxonomy";
import { formatDate } from "@/lib/site";

export async function generateMetadata(props: PageProps<"/companies/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();
  return { title: company.name, description: company.description ?? undefined };
}

export default function CompanyDetailPage(props: PageProps<"/companies/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-subtle" />}>
        <CompanyDetail params={props.params} />
      </Suspense>
    </div>
  );
}

async function CompanyDetail({ params }: { params: PageProps<"/companies/[slug]">["params"] }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  return (
    <>
      <Breadcrumb
        items={[{ href: "/companies", label: "游戏会社" }, { label: company.name }]}
      />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">{company.name}</h1>
          <p className="mt-1.5 text-[14px] text-muted">
            {company.aliases.join(", ") || "暂无别名"}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet to-primary text-[10px] font-semibold text-white">
              {company.name.slice(0, 1)}
            </span>
            <div className="leading-tight">
              <p className="text-[13.5px] font-medium text-ink">档案组</p>
              <p className="text-[12.5px] text-faint">整理于本站</p>
            </div>
          </div>
        </div>

        <Link
          href={`/companies/${company.slug}`}
          className="rounded-xl bg-primary px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
        >
          {company.count} 个游戏
        </Link>
      </div>

      <Suspense fallback={null}>
        <CompanyEditor
          slug={company.slug}
          values={{
            name: company.name,
            aliases: company.aliases.join(", "),
            website: company.website ?? "",
            mainLanguage: company.mainLanguage ?? "",
            region: company.region ?? "",
            description: company.description ?? "",
          }}
        />
      </Suspense>

      <section className="mt-7 space-y-5">
        <div>
          <h2 className="mb-2 text-[15px] font-semibold text-ink">别名</h2>
          <div className="flex flex-wrap gap-2">
            {company.aliases.length > 0 ? (
              company.aliases.map((alias) => (
                <span
                  key={alias}
                  className="rounded-md bg-violet-soft px-2 py-1 text-[13px] font-medium text-violet"
                >
                  {alias}
                </span>
              ))
            ) : (
              <span className="text-[14px] text-faint">暂无</span>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-[15px] font-semibold text-ink">官网地址</h2>
          {company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-[14px] text-primary-strong hover:underline"
            >
              {company.website}
              <ExternalLinkIcon size={13} />
            </a>
          ) : (
            <span className="text-[14px] text-faint">暂无</span>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-[15px] font-semibold text-ink">主语言</h2>
          {company.mainLanguage ? (
            <span className="rounded-md bg-mint-soft px-2 py-1 text-[13px] font-medium text-mint">
              {company.mainLanguage}
            </span>
          ) : (
            <span className="text-[14px] text-faint">暂无</span>
          )}
        </div>

        {company.description && (
          <div>
            <h2 className="mb-2 text-[15px] font-semibold text-ink">简介</h2>
            <p className="text-[14.5px] leading-relaxed text-ink-soft">{company.description}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-[13px] text-faint">
          <span className="flex items-center gap-1.5">
            <GlobeIcon size={13} />
            {company.region ?? "未标注地区"}
          </span>
          <span className="flex items-center gap-1.5">
            <LanguagesIcon size={13} />
            {company.mainLanguage ?? "未标注语言"}
          </span>
          <span className="flex items-center gap-1.5">
            <TagIcon size={13} />
            收录 {company.count} 个条目
          </span>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-ink">该会社的条目</h2>
          <span className="text-[13px] text-faint">按资源更新时间排序</span>
        </div>
        <GameGrid games={company.games} />
      </section>
    </>
  );
}
