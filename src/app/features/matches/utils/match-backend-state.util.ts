import { MatchStatus as BackendMatchStatus } from '../models/match.models';
import { MatchStatus } from '../models/progressive-match.models';

export function mapBackendMatchStatus(
  status: BackendMatchStatus | undefined,
  accepted: number,
  pending: number,
  totalInvited: number,
  requiredPlayers = totalInvited,
): MatchStatus {
  if (status === 'FINALIZADO') {
    return MatchStatus.FINISHED;
  }
  if (status === 'INVALIDO') {
    return MatchStatus.INVALID;
  }
  if (status === 'INICIADO') {
    return MatchStatus.LIVE;
  }

  const allConfirmed = accepted >= requiredPlayers;

  if (allConfirmed) {
    return MatchStatus.CONFIRMED;
  }
  if (accepted > 0) {
    return MatchStatus.PARTIAL_CONFIRMATIONS;
  }
  return MatchStatus.CREATED;
}

export function isClosePendingFallback(
  status: BackendMatchStatus | undefined,
  scheduledAt: string | undefined,
  accepted: number,
  pending: number,
  totalInvited: number,
  nowMs = Date.now(),
  requiredPlayers = totalInvited,
): boolean {
  if (status === 'FINALIZADO' || status === 'INVALIDO') {
    return false;
  }

  const scheduledAtMs = scheduledAt ? new Date(scheduledAt).getTime() : Number.NaN;
  if (!Number.isFinite(scheduledAtMs)) {
    return false;
  }

  const oneHourAfterKickoff = scheduledAtMs + 60 * 60 * 1000;
  const allConfirmed = accepted >= requiredPlayers;
  return allConfirmed && nowMs >= oneHourAfterKickoff;
}
