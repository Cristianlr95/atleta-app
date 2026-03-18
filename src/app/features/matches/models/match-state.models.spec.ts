import { MatchStatus } from './progressive-match.models';
import { MatchLifecycleState, resolveLifecycleState } from './match-state.models';

describe('resolveLifecycleState', () => {
  it('returns created without confirmations when none accepted', () => {
    const state = resolveLifecycleState(MatchStatus.CREATED, 0, 10, 10);
    expect(state).toBe(MatchLifecycleState.CREATED_WITHOUT_CONFIRMATIONS);
  });

  it('returns partial when at least one accepted and not full', () => {
    const state = resolveLifecycleState(MatchStatus.PARTIAL_CONFIRMATIONS, 2, 8, 10);
    expect(state).toBe(MatchLifecycleState.CREATED_WITH_PARTIAL_CONFIRMATIONS);
  });

  it('returns confirmed when all invited accepted', () => {
    const state = resolveLifecycleState(MatchStatus.CONFIRMED, 10, 0, 10);
    expect(state).toBe(MatchLifecycleState.CREATED_CONFIRMED);
  });

  it('is idempotent for same inputs', () => {
    const a = resolveLifecycleState(MatchStatus.CONFIRMED, 10, 0, 10);
    const b = resolveLifecycleState(MatchStatus.CONFIRMED, 10, 0, 10);
    expect(a).toBe(b);
  });

  it('returns finished when match status is finished', () => {
    const state = resolveLifecycleState(MatchStatus.FINISHED, 10, 0, 10);
    expect(state).toBe(MatchLifecycleState.FINISHED);
  });
});
