export const LEVEL_THRESHOLDS = {
  beginner: 100,
  intermediate: 300,
  advanced: 500,
} as const;

export type LevelKey = keyof typeof LEVEL_THRESHOLDS;

export function xpRequiredFor(level: LevelKey) {
  return LEVEL_THRESHOLDS[level];
}

export function nextThreshold(level: LevelKey) {
  return LEVEL_THRESHOLDS[level];
}

export function isLevelUnlocked(currentXp: number, target: LevelKey) {
  if (target === 'beginner') return true;
  if (target === 'intermediate') return currentXp >= LEVEL_THRESHOLDS.beginner;
  if (target === 'advanced') return currentXp >= LEVEL_THRESHOLDS.intermediate;
  return false;
}

export function isLevelCompleted(currentXp: number, target: LevelKey) {
  return currentXp >= LEVEL_THRESHOLDS[target];
}
