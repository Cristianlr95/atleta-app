import { toCanonicalMatchOutcome } from './match-outcome.mapper';

describe('toCanonicalMatchOutcome', () => {
  it('maps GANADO and VICTORIA to GANADO', () => {
    expect(toCanonicalMatchOutcome('GANADO')).toBe('GANADO');
    expect(toCanonicalMatchOutcome('VICTORIA')).toBe('GANADO');
  });

  it('maps EMPATE and EMPATADO to EMPATADO', () => {
    expect(toCanonicalMatchOutcome('EMPATE')).toBe('EMPATADO');
    expect(toCanonicalMatchOutcome('EMPATADO')).toBe('EMPATADO');
  });

  it('maps PERDIDO and DERROTA to PERDIDO', () => {
    expect(toCanonicalMatchOutcome('PERDIDO')).toBe('PERDIDO');
    expect(toCanonicalMatchOutcome('DERROTA')).toBe('PERDIDO');
  });

  it('returns null for unknown values', () => {
    expect(toCanonicalMatchOutcome('')).toBeNull();
    expect(toCanonicalMatchOutcome('NO_APLICA')).toBeNull();
    expect(toCanonicalMatchOutcome(undefined)).toBeNull();
  });
});
