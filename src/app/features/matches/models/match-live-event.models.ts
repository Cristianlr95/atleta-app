import { MatchStatus, PlayerInvitationStatus } from './progressive-match.models';

export type MatchLiveEventType =
  | 'INVITE_ACCEPTED'
  | 'INVITE_DECLINED'
  | 'INVITE_PENDING'
  | 'TEAM_UPDATED'
  | 'MATCH_STATUS_CHANGED';

export interface MatchLiveEvent {
  id: string;
  type: MatchLiveEventType;
  createdAt: string;
  backendMatchId: number;
  localMatchId?: string;
  actorUuid?: string;
  backendInviteId?: number;
  status?: PlayerInvitationStatus;
  nextMatchStatus?: MatchStatus;
}
