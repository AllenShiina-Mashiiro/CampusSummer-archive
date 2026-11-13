import Link from "next/link";
import type { Game } from "@prisma/client";

export function GameCard({ game }: { game: Game }) {
  return (
    <Link className="game-card" href={`/games/${game.slug}`}>
      <div className="game-cover">
        {game.coverUrl ? <img src={game.coverUrl} alt="" /> : <span className="cover-placeholder">{game.title.slice(0, 1)}</span>}
      </div>
      <div className="game-info">
        <h3 title={game.title}>{game.title}</h3>
        <div className="game-meta"><span>{game.developer || "会社未收录"}</span><span>{game.releaseDate ? game.releaseDate.getFullYear() : "发行日期未收录"}</span></div>
        {game.tags.length > 0 && <div className="tag-row">{game.tags.slice(0, 3).map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}</div>}
      </div>
    </Link>
  );
}
