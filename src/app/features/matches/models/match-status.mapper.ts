import { MatchStatus } from './progressive-match.models';

export function getMatchStatusLabel(status: MatchStatus): string {
  if (status === MatchStatus.CREATED) {
    return 'Invitaciones enviadas';
  }
  if (status === MatchStatus.PARTIAL_CONFIRMATIONS) {
    return 'Armandose el partido';
  }
  if (status === MatchStatus.CONFIRMED) {
    return 'Partido confirmado';
  }
  if (status === MatchStatus.LIVE) {
    return 'En juego';
  }
  if (status === MatchStatus.INVALID) {
    return 'Partido invalido';
  }
  return 'Finalizado';
}

export function getMatchStatusTone(status: MatchStatus): 'neutral' | 'warning' | 'success' | 'danger' {
  if (status === MatchStatus.CONFIRMED || status === MatchStatus.FINISHED) {
    return 'success';
  }
  if (status === MatchStatus.LIVE || status === MatchStatus.INVALID) {
    return 'danger';
  }
  if (status === MatchStatus.PARTIAL_CONFIRMATIONS) {
    return 'warning';
  }
  return 'neutral';
}

export function getMatchStatusIconAsset(status: MatchStatus): string {
  const base = 'assets/icons/atleta-raster-v1';

  if (status === MatchStatus.CONFIRMED) {
    return `${base}/ic_status_confirmed_96.png`;
  }
  if (status === MatchStatus.PARTIAL_CONFIRMATIONS) {
    return `${base}/ic_status_in_assembly_96.png`;
  }
  if (status === MatchStatus.LIVE) {
    return `${base}/ic_status_in_progress_96.png`;
  }
  if (status === MatchStatus.INVALID) {
    return `${base}/ic_status_canceled_96.png`;
  }
  if (status === MatchStatus.FINISHED) {
    return `${base}/ic_status_finished_96.png`;
  }

  return `${base}/ic_status_pending_96.png`;
}
