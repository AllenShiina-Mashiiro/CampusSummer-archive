import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { deleteGameAction, deleteResourceAction, saveResourceAction } from "@/app/admin/game-actions";
import { GameForm } from "@/components/admin/game-form";
import { fieldClass } from "@/components/settings-card";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "编辑条目", robots: { index: false } };

export default function EditGamePage(props: PageProps<"/admin/games/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-subtle" />}>
      <EditGame params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function EditGame({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/games/[id]">["params"];
  searchParams: PageProps<"/admin/games/[id]">["searchParams"];
}) {
  await connection();
  await requireAdmin();

  const [{ id }, raw] = await Promise.all([params, searchParams]);
  const error = typeof raw?.error === "string" ? raw.error : undefined;

  const [game, companies] = await Promise.all([
    db.game.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        originalTitle: true,
        romanizedTitle: true,
        slug: true,
        summary: true,
        coverUrl: true,
        platforms: true,
        languages: true,
        isSfw: true,
        companyId: true,
        company: { select: { name: true } },
        releaseDate: true,
        createdAt: true,
        tags: { select: { tag: { select: { name: true } } } },
        resources: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            type: true,
            provider: true,
            url: true,
            format: true,
            size: true,
            netdisk: true,
            extractCode: true,
            note: true,
            createdAt: true,
          },
        },
      },
    }),
    db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!game) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight text-ink">{game.title}</h1>
          <p className="mt-1.5 text-[14px] text-muted">
            slug: {game.slug} · 创建于 {formatDate(game.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/galgame/${game.slug}`}
            className="rounded-xl border border-line px-3 py-1.5 text-[13.5px] text-ink-soft transition-colors hover:text-ink"
          >
            查看前台
          </Link>
          <Link
            href="/admin/games"
            className="text-[13.5px] text-muted transition-colors hover:text-ink"
          >
            返回列表
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
            releaseDate: game.releaseDate
              ? game.releaseDate.toISOString().slice(0, 10)
              : "",
            tags: game.tags.map((entry) => entry.tag.name).join(", "),
          }}
          companies={companies}
          error={error}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[16px] font-semibold text-ink">资源链接</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          只记录元数据与外部链接，不托管文件。
        </p>

        <ul className="mt-4 divide-y divide-line">
          {game.resources.length === 0 && (
            <li className="py-4 text-[13.5px] text-faint">还没有资源。</li>
          )}
          {game.resources.map((resource) => (
            <li key={resource.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-[14px] text-primary-strong hover:underline"
                >
                  {resource.title}
                </a>
                <p className="mt-0.5 text-[12.5px] text-faint">
                  {resource.type} · {resource.provider === "OFFICIAL" ? "官方" : "社区"} ·{" "}
                  {formatDate(resource.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/admin/games/${game.id}?editResource=${resource.id}#resource-form`}
                  className="rounded-lg border border-line px-2.5 py-1 text-[13px] text-ink-soft transition-colors hover:border-primary/40 hover:text-primary-strong"
                >
                  编辑
                </a>
                <form action={deleteResourceAction}>
                  <input type="hidden" name="resourceId" value={resource.id} />
                  <input type="hidden" name="gameId" value={game.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-line px-2.5 py-1 text-[13px] text-muted transition-colors hover:border-rose/40 hover:text-rose"
                  >
                    删除
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>

        <form id="resource-form" action={saveResourceAction} className="mt-4 space-y-3 border-t border-line pt-4">
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="back" value="/admin" />

          {(() => {
            const editingId = typeof raw.editResource === "string" ? raw.editResource : "";
            const editing = game.resources.find((item) => item.id === editingId);
            if (!editing) return null;
            return (
              <>
                <input type="hidden" name="resourceId" value={editing.id} />
                <p className="rounded-lg bg-primary-soft px-3 py-2 text-[13px] text-primary-strong">
                  正在编辑「{editing.title}」，修改后保存即可
                </p>
              </>
            );
          })()}

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="resourceTitle"
              placeholder="资源标题（必填）"
              defaultValue={game.resources.find((item) => item.id === raw.editResource)?.title ?? ""}
              className={fieldClass}
              required
            />
            <input
              name="resourceUrl"
              placeholder="链接（必填）"
              defaultValue={game.resources.find((item) => item.id === raw.editResource)?.url ?? ""}
              className={fieldClass}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <select
              name="resourceType"
              defaultValue={game.resources.find((item) => item.id === raw.editResource)?.type ?? "GAME"}
              className={fieldClass}
            >
              <option value="GAME">游戏本体</option>
              <option value="PATCH">补丁</option>
              <option value="CG">图片素材</option>
              <option value="OTHER">其他</option>
            </select>
            <span className="flex items-center rounded-lg bg-subtle px-3 py-2 text-[13px] text-muted">
              来源由你的身份自动判定：管理员及以上记为「官方」，创作者记为「社区整理」
            </span>
            <input
              name="resourceFormat"
              placeholder="格式（可选）"
              defaultValue={game.resources.find((item) => item.id === raw.editResource)?.format ?? ""}
              className={fieldClass}
            />
            <input
              name="resourceSize"
              placeholder="大小（可选）"
              defaultValue={game.resources.find((item) => item.id === raw.editResource)?.size ?? ""}
              className={fieldClass}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="resourceNetdisk"
              placeholder="网盘（如 百度网盘 / 夸克 / PikPak / Google Drive）"
              defaultValue={game.resources.find((item) => item.id === raw.editResource)?.netdisk ?? ""}
              list="netdisk-options"
              className={fieldClass}
            />
            <datalist id="netdisk-options">
              {["百度网盘", "阿里云盘", "夸克网盘", "123 盘", "天翼云盘", "115", "PikPak", "Google Drive", "OneDrive", "MEGA", "直链下载"].map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <input
              name="resourceExtractCode"
              placeholder="提取码（可选）"
              defaultValue={game.resources.find((item) => item.id === raw.editResource)?.extractCode ?? ""}
              className={fieldClass}
            />
          </div>

          <input
            name="resourceNote"
            placeholder="备注（可选）"
            defaultValue={game.resources.find((item) => item.id === raw.editResource)?.note ?? ""}
            className={fieldClass}
          />

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

      <section className="mt-6 rounded-2xl border border-line border-rose/20 bg-surface p-5">
        <h2 className="text-[16px] font-semibold text-ink">删除条目</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          会一并删除该条目的资源、评论与评分，操作不可撤销。
        </p>
        <form action={deleteGameAction} className="mt-3">
          <input type="hidden" name="id" value={game.id} />
          <button
            type="submit"
            className="rounded-xl border border-rose/30 px-4 py-2 text-[13.5px] font-medium text-rose transition-colors hover:bg-rose-soft"
          >
            删除这个条目
          </button>
        </form>
      </section>
    </div>
  );
}
