import { levelFromPoints } from "@/lib/level";

/** 樱花点等级徽标：LV.3 */
export function LevelBadge({ points, className = "" }: { points: number; className?: string }) {
  const { level } = levelFromPoints(points);

  return (
    <span
      title={`樱花点 ${points}`}
      className={`inline-flex items-center rounded-md bg-violet-soft px-1.5 py-0.5 text-[11.5px] font-semibold text-violet ${className}`}
    >
      LV.{level}
    </span>
  );
}
