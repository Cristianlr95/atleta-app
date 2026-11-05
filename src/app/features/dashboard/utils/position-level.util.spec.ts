import { positionLevel } from './position-level.util';

describe('positionLevel', () => {
  it('requires 100 XP for the first level and 25 more for each following level', () => {
    expect(positionLevel(0)).toEqual({ level: 1, currentXp: 0, requiredXp: 100, percent: 0 });
    expect(positionLevel(99).level).toBe(1);
    expect(positionLevel(100)).toEqual({ level: 2, currentXp: 0, requiredXp: 125, percent: 0 });
    expect(positionLevel(224).level).toBe(2);
    expect(positionLevel(225).level).toBe(3);
    expect(positionLevel(25).level).toBe(1);
  });
});
