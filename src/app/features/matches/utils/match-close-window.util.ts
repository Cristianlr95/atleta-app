import { MatchResponse } from '../models/match.models';

export function getMatchCloseBlockedReason(
  match: Pick<MatchResponse, 'estado'> & Partial<Pick<MatchResponse, 'startedAt' | 'validationReason'>>,
  now = Date.now(),
): string | null {
  if (match.estado === 'INVALIDO') {
    return match.validationReason || 'Este partido fue invalidado y no puede cerrarse.';
  }
  if (match.estado === 'FINALIZADO') {
    return 'Este partido ya fue finalizado. No se pueden modificar sus resultados.';
  }
  if (match.estado !== 'INICIADO' || !match.startedAt || !Number.isFinite(Date.parse(match.startedAt))) {
    return 'Debes iniciar el partido antes de cerrarlo.';
  }
  const elapsed = now - Date.parse(match.startedAt);
  if (elapsed < 60 * 60 * 1000) {
    return 'El cierre se habilita 1 hora después del inicio del partido.';
  }
  if (elapsed > 3 * 60 * 60 * 1000) {
    return 'La ventana de cierre de 3 horas ha vencido.';
  }
  return null;
}
