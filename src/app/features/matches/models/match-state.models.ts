import { Match, MatchParticipant, MatchProgressView, MatchStatus, Player, Venue } from './progressive-match.models';

export enum MatchLifecycleState {
  CREATED_WITHOUT_CONFIRMATIONS = 'CREATED_WITHOUT_CONFIRMATIONS',
  CREATED_WITH_PARTIAL_CONFIRMATIONS = 'CREATED_WITH_PARTIAL_CONFIRMATIONS',
  CREATED_CONFIRMED = 'CREATED_CONFIRMED',
  FINISHED = 'FINISHED',
}

export interface MatchState {
  routeMatchId: string;
  localMatchId: string;
  backendMatchId?: number;
  match: Match;
  participants: MatchParticipant[];
  confirmedParticipants: MatchParticipant[];
  pendingParticipants: MatchParticipant[];
  declinedParticipants: MatchParticipant[];
  confirmedPlayers: Player[];
  progress: MatchProgressView;
  venue: Venue | null;
  lifecycleState: MatchLifecycleState;
}

export function lifecycleToUserLabel(state: MatchLifecycleState): string {
  if (state === MatchLifecycleState.CREATED_WITH_PARTIAL_CONFIRMATIONS) {
    return 'Armandose el partido';
  }
  if (state === MatchLifecycleState.CREATED_CONFIRMED) {
    return 'Partido confirmado';
  }
  if (state === MatchLifecycleState.FINISHED) {
    return 'Finalizado';
  }
  return 'Invitaciones enviadas';
}

export function resolveLifecycleState(
  status: MatchStatus,
  acceptedCount: number,
  pendingCount: number,
  totalInvited: number,
): MatchLifecycleState {
  if (status === MatchStatus.FINISHED) {
    return MatchLifecycleState.FINISHED;
  }

  if (totalInvited > 0 && acceptedCount === totalInvited && pendingCount === 0) {
    return MatchLifecycleState.CREATED_CONFIRMED;
  }

  if (acceptedCount > 0) {
    return MatchLifecycleState.CREATED_WITH_PARTIAL_CONFIRMATIONS;
  }

  return MatchLifecycleState.CREATED_WITHOUT_CONFIRMATIONS;
}
