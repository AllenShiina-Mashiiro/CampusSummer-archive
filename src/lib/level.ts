/** 樱花点等级：LV1–LV6，累计经验阈值依次为 100 / 500 / 1000 / 2500 / 5000 / 10000 */
export const LEVEL_THRESHOLDS = [100, 500, 1000, 2500, 5000, 10000] as const;

export type LevelInfo = {
  level: number;
  /** 当前等级起点经验（LV1 从 0 起算） */
  floor: number;
  /** 升到下一级所需经验；已满级为 null */
  next: number | null;
  /** 当前等级内的进度 0–1 */
  progress: number;
};

export function levelFromPoints(points: number): LevelInfo {
  const safe = Math.max(0, points);
  let level = 1;

  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (safe >= LEVEL_THRESHOLDS[index]) level = index + 2; // 达到第 n 个阈值即 LV(n+1)
  }

  const floor = level === 1 ? 0 : LEVEL_THRESHOLDS[level - 2];
  const next = level >= LEVEL_THRESHOLDS.length + 1 ? null : LEVEL_THRESHOLDS[level - 1];
  const progress = next === null ? 1 : Math.min(1, Math.max(0, (safe - floor) / (next - floor)));

  return { level, floor, next, progress };
}

/** 升级还差多少点；已满级返回 0 */
export function pointsToNextLevel(points: number): number {
  const info = levelFromPoints(points);
  return info.next === null ? 0 : Math.max(0, info.next - points);
}
