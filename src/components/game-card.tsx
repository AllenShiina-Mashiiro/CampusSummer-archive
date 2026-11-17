import Link from "next/link";

import { EyeIcon, StarIcon } from "@/components/icons";
import type { GameCardData } from "@/lib/games";
import { compactNumber } from "@/lib/site";

/** 平台用紫色标签，语言用绿色标签，和参考站一致 */
function PlatformChip({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-violet-soft px-1.5 py-0.5 text-[11px] font-medium text-violet sm:text-[12px]">
      {label}
    </span>
  );
}

function LanguageChip({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-mint-soft px-1.5 py-0.5 text-[11px] font-medium text-mint sm:text-[12px]">
      {label}
    </span>
  );
}

export function GameCard({ game, href }: { game: GameCardData; href?: string }) {
  return (
    <Link
      href={href ?? `/galgame/${game.slug}`}
      className="glass-card card-hover group block overflow-hidden rounded-[14px]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-subtle">
        {game.coverUrl ? (
          // 封面可能来自 S3 或本地 /covers，统一用原生 img 免去远端域名白名单
          <img
            src={game.coverUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8effc] to-[#e6e2fb] text-[13px] text-faint dark:from-[#1b2130] dark:to-[#221d33]">
            暂无封面
          </div>
        )}
      </div>

      <div className="min-w-0 px-2.5 py-2.5 sm:px-3 sm:py-3">
        <h3 className="clamp-2 text-[13.5px] font-semibold leading-[1.45] text-ink transition-colors group-hover:text-primary-strong sm:text-[15.5px]">
          {game.title}
        </h3>

        <div className="mt-1.5 flex items-center gap-2.5 text-[12px] text-muted sm:mt-2 sm:gap-3 sm:text-[13px]">
          <span className="flex items-center gap-1">
            <StarIcon size={12} filled className="text-amber" />
            <span className="text-ink-soft">{game.rating.toFixed(1)}</span>
          </span>
          <span className="flex items-center gap-1">
            <EyeIcon size={12} className="text-faint" />
            {compactNumber(game.viewCount)}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2">
          {game.platforms.slice(0, 3).map((platform) => (
            <PlatformChip key={platform} label={platform} />
          ))}
          {game.languages.slice(0, 2).map((language) => (
            <LanguageChip key={language} label={language.replace("简体中文", "中文")} />
          ))}
        </div>
      </div>
    </Link>
  );
}

/** 四列网格，与参考站列表密度一致。hrefFor 可把卡片指向别处（例如讨论版） */
export function GameGrid({
  games,
  hrefFor,
}: {
  games: GameCardData[];
  hrefFor?: (game: GameCardData) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} href={hrefFor?.(game)} />
      ))}
    </div>
  );
}

export function GameGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-card overflow-hidden rounded-[14px]">
          <div className="aspect-[16/10] bg-subtle" />
          <div className="space-y-2 px-3 py-3">
            <div className="h-3.5 w-4/5 rounded bg-subtle" />
            <div className="h-3 w-1/2 rounded bg-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}
