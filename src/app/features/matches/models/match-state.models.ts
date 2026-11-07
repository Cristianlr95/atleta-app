import { Match, MatchParticipant, MatchProgressView, MatchStatus, Player, Venue } from './progressive-match.models';

export enum MatchLifecycleState {
  CREATED_WITHOUT_CONFIRMATIONS = 'CREATED_WITHOUT_CONFIRMATIONS',
  CREATED_WITH_PARTIAL_CONFIRMATIONS = 'CREATED_WITH_PARTIAL_CONFIRMATIONS',
  CREATED_CONFIRMED = 'CREATED_CONFIRMED',
  LIVE = 'LIVE',
  CLOSE_PENDING = 'CLOSE_PENDING',
  FINISHED = 'FINISHED',
  INVALID = 'INVALID',
}

export interface MatchState {
  routeMatchId: string;
  localMatchId: string;
  backendMatchId?: number;
  match: Match;
  participants: MatchParticipant[];
  confirmedParticipants: MatchParticipant[];
  pendingParticipants: MatchParticipant[];
  waitlistedParticipants: MatchParticipant[];
  declinedParticipants: MatchParticipant[];
  confirmedPlayers: Player[];
  progress: MatchProgressView;
  venue: Venue | null;
  lifecycleState: MatchLifecycleState;
}

export function lifecycleToUserLabel(state: MatchLifecycleState): string {
  if (state === MatchLifecycleState.LIVE) {
    return 'Partido en juego';
  }
  if (state === MatchLifecycleState.CLOSE_PENDING) {
    return 'Cierre pendiente';
  }
  if (state === MatchLifecycleState.CREATED_WITH_PARTIAL_CONFIRMATIONS) {
    return 'Armandose el partido';
  }
  if (state === MatchLifecycleState.CREATED_CONFIRMED) {
    return 'Partido confirmado';
  }
  if (state === MatchLifecycleState.FINISHED) {
    return 'Finalizado';
  }
  if (state === MatchLifecycleState.INVALID) {
    return 'Partido cancelado';
  }
  return 'Invitaciones enviadas';
}

export function resolveLifecycleState(
  status: MatchStatus,
  acceptedCount: number,
  pendingCount: number,
  totalInvited: number,
  closePending = false,
): MatchLifecycleState {
  if (status === MatchStatus.FINISHED) {
    return MatchLifecycleState.FINISHED;
  }

  if (status === MatchStatus.INVALID) {
    return MatchLifecycleState.INVALID;
  }

  if (status === MatchStatus.LIVE) {
    return closePending ? MatchLifecycleState.CLOSE_PENDING : MatchLifecycleState.LIVE;
  }

  if (status === MatchStatus.CONFIRMED || (totalInvited > 0 && acceptedCount === totalInvited && pendingCount === 0)) {
    return MatchLifecycleState.CREATED_CONFIRMED;
  }

  if (acceptedCount > 0) {
    return MatchLifecycleState.CREATED_WITH_PARTIAL_CONFIRMATIONS;
  }

  return MatchLifecycleState.CREATED_WITHOUT_CONFIRMATIONS;
}
