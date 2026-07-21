import { MatchType } from './progressive-match.models';

/**
 * Resolves the API value without deriving competitive meaning from team shape.
 * The fallback only supports responses produced before matchType was persisted.
 */
export function toCanonicalMatchType(
  apiType: MatchType | undefined,
  previouslyLoadedType?: MatchType,
): MatchType {
  return apiType ?? previouslyLoadedType ?? MatchType.FRIENDLY;
}
