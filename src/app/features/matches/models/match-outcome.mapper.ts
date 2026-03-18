import { MatchOutcome } from './match.models';

export type ApiMatchOutcomeToken =
  | 'GANADO'
  | 'PERDIDO'
  | 'EMPATE'
  | 'EMPATADO'
  | 'VICTORIA'
  | 'DERROTA';

export function toCanonicalMatchOutcome(value: unknown): MatchOutcome | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.toUpperCase();

  if (normalized === 'GANADO' || normalized === 'VICTORIA') {
    return 'GANADO';
  }

  if (normalized === 'EMPATE' || normalized === 'EMPATADO') {
    return 'EMPATADO';
  }

  if (normalized === 'PERDIDO' || normalized === 'DERROTA') {
    return 'PERDIDO';
  }

  return null;
}
