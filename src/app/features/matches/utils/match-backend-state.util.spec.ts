import { MatchStatus } from '../models/progressive-match.models';
import { isClosePendingFallback, mapBackendMatchStatus } from './match-backend-state.util';

describe('match-backend-state util', () => {
  it('maps terminal backend states directly', () => {
    expect(mapBackendMatchStatus('FINALIZADO', 0, 0, 0)).toBe(MatchStatus.FINISHED);
    expect(mapBackendMatchStatus('INVALIDO', 0, 0, 0)).toBe(MatchStatus.INVALID);
    expect(mapBackendMatchStatus('INICIADO', 0, 0, 0)).toBe(MatchStatus.LIVE);
  });

  it('derives created confirmation state from participant counts', () => {
    expect(mapBackendMatchStatus('CREADO', 10, 0, 10)).toBe(MatchStatus.CONFIRMED);
    expect(mapBackendMatchStatus('CREADO', 3, 7, 10)).toBe(MatchStatus.PARTIAL_CONFIRMATIONS);
    expect(mapBackendMatchStatus('CREADO', 0, 10, 10)).toBe(MatchStatus.CREATED);
  });

  it('computes close pending only after kickoff window and full confirmation', () => {
    const scheduledAt = '2026-06-15T20:00:00.000Z';
    const beforeWindow = new Date('2026-06-15T20:59:00.000Z').getTime();
    const afterWindow = new Date('2026-06-15T21:01:00.000Z').getTime();

    expect(isClosePendingFallback('INICIADO', scheduledAt, 10, 0, 10, beforeWindow)).toBeFalse();
    expect(isClosePendingFallback('INICIADO', scheduledAt, 10, 0, 10, afterWindow)).toBeTrue();
    expect(isClosePendingFallback('FINALIZADO', scheduledAt, 10, 0, 10, afterWindow)).toBeFalse();
    expect(isClosePendingFallback('INICIADO', scheduledAt, 9, 1, 10, afterWindow)).toBeFalse();
    expect(isClosePendingFallback('INICIADO', 'no-date', 10, 0, 10, afterWindow)).toBeFalse();
  });
});
