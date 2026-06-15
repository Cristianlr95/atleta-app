import { SocialRequestItem } from '../../social/models/social.models';
import { MatchResponse } from '../models/match.models';
import { Match, MatchParticipant, PlayerInvitationStatus } from '../models/progressive-match.models';

export function buildUnifiedMatchParticipants(
  match: Match,
  response: MatchResponse | null,
  invites: SocialRequestItem[],
  positionMap: Record<string, string>,
): MatchParticipant[] {
  const fromApi = new Map<string, MatchParticipant>();

  for (const player of response?.players ?? []) {
    const playerUuid = player.player?.atletaUuid;
    if (!playerUuid || fromApi.has(playerUuid)) {
      continue;
    }

    fromApi.set(playerUuid, {
      userId: playerUuid,
      name: player.player?.alias ?? 'Jugador',
      status:
        player.confirmado || player.rol === 'CAPITAN'
          ? PlayerInvitationStatus.ACCEPTED
          : PlayerInvitationStatus.PENDING,
      gender: player.player?.genero,
      position: player.position?.nombre ?? positionMap[playerUuid] ?? 'Sin posicion',
      teamSide: player.teamSide === 'LOCAL' ? 'HOME' : player.teamSide === 'VISITA' ? 'AWAY' : undefined,
    });
  }

  const merged = new Map<string, MatchParticipant>(fromApi);

  for (const invite of invites) {
    const apiDetail = merged.get(invite.targetUuid) ?? fromApi.get(invite.targetUuid);
    const inviteStatus = mapInviteStatus(invite.status);
    const resolvedStatus =
      apiDetail?.status === PlayerInvitationStatus.ACCEPTED || inviteStatus === PlayerInvitationStatus.ACCEPTED
        ? PlayerInvitationStatus.ACCEPTED
        : inviteStatus === PlayerInvitationStatus.DECLINED
          ? PlayerInvitationStatus.DECLINED
          : apiDetail?.status ?? PlayerInvitationStatus.PENDING;

    merged.set(invite.targetUuid, {
      userId: invite.targetUuid,
      name: invite.targetAlias || apiDetail?.name || 'Jugador',
      status: resolvedStatus,
      gender: apiDetail?.gender,
      position: apiDetail?.position ?? positionMap[invite.targetUuid] ?? 'Sin posicion',
      teamSide: apiDetail?.teamSide,
    });
  }

  if (match.creatorUuid && !merged.has(match.creatorUuid)) {
    const creatorPlayer = [...(match.homePlayers ?? []), ...(match.awayPlayers ?? [])].find(
      (player) => player.uuid === match.creatorUuid,
    );
    merged.set(match.creatorUuid, {
      userId: match.creatorUuid,
      name: match.creatorName || 'Creador',
      status: PlayerInvitationStatus.ACCEPTED,
      gender: creatorPlayer?.gender,
      position: positionMap[match.creatorUuid] ?? 'Creador',
    });
  }

  return applyTeamPresentation(match, Array.from(merged.values()));
}

function mapInviteStatus(status: SocialRequestItem['status']): PlayerInvitationStatus {
  if (status === 'ACEPTADA') {
    return PlayerInvitationStatus.ACCEPTED;
  }
  if (status === 'RECHAZADA') {
    return PlayerInvitationStatus.DECLINED;
  }
  return PlayerInvitationStatus.PENDING;
}

function applyTeamPresentation(match: Match, participants: MatchParticipant[]): MatchParticipant[] {
  const homeSet = new Set(match.homePlayers.map((item) => item.uuid));
  const awaySet = new Set(match.awayPlayers.map((item) => item.uuid));

  return participants.map((item) => {
    if (homeSet.has(item.userId)) {
      return { ...item, teamSide: 'HOME', kitColor: match.homeKitColor || 'Azul' };
    }
    if (awaySet.has(item.userId)) {
      return { ...item, teamSide: 'AWAY', kitColor: match.awayKitColor || 'Rojo' };
    }
    return item;
  });
}
