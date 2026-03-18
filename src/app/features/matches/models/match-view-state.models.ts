import { MatchState, lifecycleToUserLabel } from './match-state.models';
import { MatchParticipant, PlayerInvitationStatus } from './progressive-match.models';

export interface MatchViewState {
  matchId: string;
  backendMatchId?: number;
  homeKitColor?: string;
  awayKitColor?: string;
  teams: {
    home: MatchParticipant[];
    away: MatchParticipant[];
  };
  invites: MatchParticipant[];
  confirmedCount: number;
  pendingCount: number;
  declinedCount: number;
  statusLabel: string;
}

export function toMatchViewState(state: MatchState): MatchViewState {
  const home = state.participants.filter((item) => item.teamSide === 'HOME');
  const away = state.participants.filter((item) => item.teamSide === 'AWAY');
  const confirmedCount = state.participants.filter(
    (item) => item.status === PlayerInvitationStatus.ACCEPTED,
  ).length;
  const pendingCount = state.participants.filter(
    (item) =>
      item.status === PlayerInvitationStatus.PENDING ||
      item.status === PlayerInvitationStatus.INVITED,
  ).length;
  const declinedCount = state.participants.filter(
    (item) => item.status === PlayerInvitationStatus.DECLINED,
  ).length;

  return {
    matchId: state.localMatchId,
    backendMatchId: state.backendMatchId,
    homeKitColor: state.match.homeKitColor,
    awayKitColor: state.match.awayKitColor,
    teams: {
      home,
      away,
    },
    invites: state.participants,
    confirmedCount,
    pendingCount,
    declinedCount,
    statusLabel: lifecycleToUserLabel(state.lifecycleState),
  };
}
