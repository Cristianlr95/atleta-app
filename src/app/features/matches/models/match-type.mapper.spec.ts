import { toCanonicalMatchType } from './match-type.mapper';
import { MatchType } from './progressive-match.models';

describe('toCanonicalMatchType', () => {
  for (const matchType of Object.values(MatchType)) {
    it(`preserves ${matchType} from the API`, () => {
      expect(toCanonicalMatchType(matchType, MatchType.INTERNAL)).toBe(matchType);
    });
  }

  it('keeps a previously loaded type for a legacy response', () => {
    expect(toCanonicalMatchType(undefined, MatchType.POINTS)).toBe(MatchType.POINTS);
  });

  it('uses FRIENDLY only when a legacy response has no prior value', () => {
    expect(toCanonicalMatchType(undefined)).toBe(MatchType.FRIENDLY);
  });
});
