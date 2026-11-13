import Link from "next/link";
import type { Game } from "@prisma/client";

export function GameCard({ game }: { game: Game }) {
  return (
    <Link className="game-card" href={`/games/${game.slug}`}>
      <div className="game-cover">
        {game.coverUrl ? <img src={game.coverUrl} alt={`${game.title} 封面`} loading="lazy" /> : <span className="cover-placeholder">CAMPUS ARCHIVE</span>}
        {game.featured ? <span className="cover-index">FEATURED</span> : null}
      </div>
      <div className="game-card-body">
        <h3>{game.title}</h3>
        {game.subtitle ? <p className="game-subtitle">{game.subtitle}</p> : <p className="game-subtitle">{game.developer ?? "会社资料待补充"}</p>}
        <div className="game-meta">{game.releaseDate ? <span>{game.releaseDate.getFullYear()}</span> : null}{game.developer ? <span>{game.developer}</span> : null}</div>
        {game.tags.length ? <div className="game-tags">{game.tags.slice(0, 3).map((tag) => <span className="tag-pill" key={tag}>{tag}</span>)}</div> : null}
      </div>
    </Link>
  );
}
