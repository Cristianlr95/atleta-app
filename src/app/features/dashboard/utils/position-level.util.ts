export interface PositionLevel {
  level: number;
  currentXp: number;
  requiredXp: number;
  percent: number;
}

export function positionLevel(xp: number): PositionLevel {
  let level = 1;
  let remaining = xp;
  let required = 100;
  while (remaining >= required) {
    remaining -= required;
    level += 1;
    required += 25;
  }
  return { level, currentXp: remaining, requiredXp: required, percent: Math.floor(remaining * 100 / required) };
}
