import { SocialRequestItem } from '../../social/models/social.models';
import { Invitation, Match, PlayerInvitationStatus } from '../models/progressive-match.models';

export function withLocalMatchInviteFallback(
  match: Match,
  remoteInvites: SocialRequestItem[],
  localInvites: Invitation[],
): SocialRequestItem[] {
  if (remoteInvites.length > 0) {
    return remoteInvites;
  }

  return localInvites
    .filter((item) => item.backendMatchId === undefined || item.backendMatchId === match.backendMatchId)
    .map((item, index) => ({
      id: item.backendInviteId ?? -(index + 1),
      type: 'MATCH_INVITE',
      status: toSocialStatus(item.status),
      requesterUuid: match.creatorUuid,
      requesterAlias: match.creatorName,
      targetUuid: item.targetUuid,
      targetAlias: item.targetName,
      teamId: match.team.id,
      teamName: match.team.name,
      matchId: match.backendMatchId,
      createdAt: item.createdAt,
      respondedAt: item.respondedAt,
    }));
}

function toSocialStatus(status: PlayerInvitationStatus): SocialRequestItem['status'] {
  if (status === PlayerInvitationStatus.ACCEPTED) {
    return 'ACEPTADA';
  }
  if (status === PlayerInvitationStatus.DECLINED) {
    return 'RECHAZADA';
  }
  return 'PENDIENTE';
}
