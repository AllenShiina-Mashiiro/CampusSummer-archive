import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { deleteGameAction, saveResourceAction } from "@/app/admin/game-actions";
import { addPurchaseLinkAction, deletePurchaseLinkAction } from "@/app/galgame/purchase-actions";
import { GameForm } from "@/components/admin/game-form";
import { fieldClass } from "@/components/settings-card";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "编辑游戏", robots: { index: false } };

export default function CreatorEditGamePage(props: PageProps<"/creator/games/[id]">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-subtle" />}>
        <EditGame params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function EditGame({
  params,
  searchParams,
}: {
  params: PageProps<"/creator/games/[id]">["params"];
  searchParams: PageProps<"/creator/games/[id]">["searchParams"];
}) {
  const user = await requireCapability("creator.center");
  const [{ id }, raw] = await Promise.all([params, searchParams]);

  const game = await db.game.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      creatorId: true,
      originalTitle: true,
      romanizedTitle: true,
      summary: true,
      coverUrl: true,
      platforms: true,
      languages: true,
      isSfw: true,
      companyId: true,
      company: { select: { name: true } },
      releaseDate: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  if (!game) notFound();
  // 协作维护：创作者之间可以互相编辑条目（补资源、改简介），不再限制只能改自己发布的

  const purchaseLinks = await db.$queryRaw<{ id: string; label: string; url: string }[]>`
    SELECT id, label, url FROM "PurchaseLink" WHERE "gameId" = ${game.id} ORDER BY "createdAt" ASC
  `;

  const companies = await db.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const error = typeof raw?.error === "string" ? raw.error : undefined;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight text-ink">{game.title}</h1>
          <p className="mt-1.5 text-[14px] text-muted">slug: {game.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/galgame/${game.slug}`}
            className="rounded-xl border border-line px-3 py-1.5 text-[13.5px] text-ink-soft transition-colors hover:text-ink"
          >
            查看前台
          </Link>
          <Link href="/creator" className="text-[13.5px] text-muted hover:text-ink">
            返回创作中心
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <GameForm
          values={{
            id: game.id,
            title: game.title,
            originalTitle: game.originalTitle,
            romanizedTitle: game.romanizedTitle,
            slug: game.slug,
            summary: game.summary,
            coverUrl: game.coverUrl,
            platforms: game.platforms,
            languages: game.languages,
            isSfw: game.isSfw,
            companyName: game.company?.name ?? "",
            releaseDate: game.releaseDate ? game.releaseDate.toISOString().slice(0, 10) : "",
            tags: game.tags.map((entry) => entry.tag.name).join(", "),
          }}
          companies={companies}
          error={error}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[16px] font-semibold text-ink">补充下载 / 补丁资源</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          所有创作者都可以给任意条目补充资源。来源按身份自动标记：管理员及以上记为「官方」，创作者记为「社区整理」。
        </p>

        <form action={saveResourceAction} className="mt-4 space-y-3 border-t border-line pt-4">
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="back" value="/creator/games" />

          <div className="grid gap-3 sm:grid-cols-3">
            <input name="resourceTitle" required placeholder="资源名称（必填）" className={fieldClass} />
            <input name="resourceUrl" required placeholder="链接（必填）" className={fieldClass} />
            <select name="resourceType" defaultValue="GAME" className={fieldClass}>
              <option value="GAME">本体下载</option>
              <option value="PATCH">汉化 / 补丁</option>
              <option value="CG">图片素材</option>
              <option value="OTHER">其他</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input name="resourceFormat" placeholder="格式（可选，如 ZIP）" className={fieldClass} />
            <input name="resourceSize" placeholder="大小（可选，如 1.2GB）" className={fieldClass} />
          </div>

          <input name="resourceNote" placeholder="备注（可选）" className={fieldClass} />

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-primary-strong"
            >
              添加资源
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-rose/20 bg-surface p-5">
        <h2 className="text-[16px] font-semibold text-ink">支持正版</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          添加官方商店、Steam、DLsite 等购买入口，可添加多条。
        </p>

        <ul className="mt-3 space-y-2">
          {purchaseLinks.length === 0 && (
            <li className="text-[13px] text-faint">还没有购买链接</li>
          )}
          {purchaseLinks.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2"
            >
              <span className="min-w-0">
                <span className="text-[13.5px] text-ink">{link.label}</span>
                <span className="ml-2 truncate text-[12px] text-faint">{link.url}</span>
              </span>
              <form action={deletePurchaseLinkAction}>
                <input type="hidden" name="id" value={link.id} />
                <input type="hidden" name="gameId" value={game.id} />
                <input type="hidden" name="back" value="/creator" />
                <button
                  type="submit"
                  className="rounded-lg border border-line px-2.5 py-1 text-[12.5px] text-muted transition-colors hover:border-rose/40 hover:text-rose"
                >
                  删除
                </button>
              </form>
            </li>
          ))}
        </ul>

        <form action={addPurchaseLinkAction} className="mt-3 space-y-3 border-t border-line pt-4">
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="back" value="/creator" />

          <div className="grid gap-3 sm:grid-cols-2">
            <input name="label" placeholder="名称（如 官方商店 / Steam）" className={fieldClass} />
            <input name="url" required placeholder="购买链接（必填）" className={fieldClass} />
          </div>
          <input name="note" placeholder="说明（可选，如「需要代理」）" className={fieldClass} />

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-primary-strong"
            >
              添加购买链接
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-rose/20 bg-surface p-5">
        <h2 className="text-[16px] font-semibold text-ink">删除游戏</h2>
        <p className="mt-1 text-[13.5px] text-muted">会一并删除该条目的资源、讨论与评分。</p>
        <form action={deleteGameAction} className="mt-3">
          <input type="hidden" name="id" value={game.id} />
          <button
            type="submit"
            className="rounded-xl border border-rose/30 px-4 py-2 text-[13.5px] font-medium text-rose transition-colors hover:bg-rose-soft"
          >
            删除这个游戏
          </button>
        </form>
      </section>
    </>
  );
}
