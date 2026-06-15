import { SocialRequestItem } from '../../social/models/social.models';
import {
  Invitation,
  Match,
  MatchGenderCategory,
  MatchSize,
  MatchStatus,
  MatchType,
  PlayerInvitationStatus,
} from '../models/progressive-match.models';
import { withLocalMatchInviteFallback } from './match-invite-fallback.util';

describe('match-invite-fallback util', () => {
  it('keeps remote invites when backend returned data', () => {
    const remote: SocialRequestItem[] = [socialInvite({ id: 99 })];

    expect(withLocalMatchInviteFallback(buildMatch(), remote, [localInvite({})])).toBe(remote);
  });

  it('maps local invites when remote invites are empty', () => {
    const match = buildMatch();
    const result = withLocalMatchInviteFallback(match, [], [
      localInvite({
        backendInviteId: 7,
        status: PlayerInvitationStatus.ACCEPTED,
        respondedAt: '2026-06-15T12:00:00',
      }),
      localInvite({
        targetUuid: 'wrong-match',
        backendMatchId: 999,
      }),
      localInvite({
        targetUuid: 'generated-id',
        targetName: 'Generated',
        backendInviteId: undefined,
        status: PlayerInvitationStatus.DECLINED,
      }),
    ]);

    expect(result).toEqual([
      {
        id: 7,
        type: 'MATCH_INVITE',
        status: 'ACEPTADA',
        requesterUuid: 'creator-1',
        requesterAlias: 'Creador',
        targetUuid: 'player-1',
        targetAlias: 'Jugador',
        teamId: 1,
        teamName: 'Equipo',
        matchId: 10,
        createdAt: '2026-06-15T10:00:00',
        respondedAt: '2026-06-15T12:00:00',
      },
      {
        id: -2,
        type: 'MATCH_INVITE',
        status: 'RECHAZADA',
        requesterUuid: 'creator-1',
        requesterAlias: 'Creador',
        targetUuid: 'generated-id',
        targetAlias: 'Generated',
        teamId: 1,
        teamName: 'Equipo',
        matchId: 10,
        createdAt: '2026-06-15T10:00:00',
        respondedAt: undefined,
      },
    ]);
  });
});

function buildMatch(): Match {
  return {
    id: 'match-10',
    backendMatchId: 10,
    creatorUuid: 'creator-1',
    creatorName: 'Creador',
    type: MatchType.FRIENDLY,
    modality: MatchSize.FIVE_VS_FIVE,
    genderCategory: MatchGenderCategory.MIXED,
    status: MatchStatus.CREATED,
    team: { id: 1, name: 'Equipo' },
    location: 'Cancha',
    scheduledAt: '2026-06-15T20:00:00',
    invitedCount: 0,
    minRequired: 10,
    homePlayers: [],
    awayPlayers: [],
    createdAt: '2026-06-15T10:00:00',
  };
}

function localInvite(overrides: Partial<Invitation>): Invitation {
  return {
    id: 'local-1',
    matchId: 'match-10',
    backendMatchId: 10,
    backendInviteId: 1,
    targetUuid: 'player-1',
    targetName: 'Jugador',
    status: PlayerInvitationStatus.PENDING,
    createdAt: '2026-06-15T10:00:00',
    ...overrides,
  };
}

function socialInvite(overrides: Partial<SocialRequestItem>): SocialRequestItem {
  return {
    id: 1,
    type: 'MATCH_INVITE',
    status: 'PENDIENTE',
    requesterUuid: 'creator-1',
    requesterAlias: 'Creador',
    targetUuid: 'player-1',
    targetAlias: 'Jugador',
    matchId: 10,
    ...overrides,
  };
}
