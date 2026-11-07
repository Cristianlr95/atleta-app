import { Match, MatchGenderCategory, MatchSize, MatchStatus, MatchType } from 'src/app/features/matches/models/progressive-match.models';
import { ActivityType } from '../models/activity.models';
import { buildActivityItems, dedupeActivityById, groupSimilarActivityEvents } from './activity-feed-mapper.util';

describe('activity-feed-mapper.util', () => {
  const playerUuid = 'player-1';

  it('builds social and match status activity items from a snapshot', () => {
    const items = buildActivityItems(
      {
        friendships: [
          {
            id: 1,
            type: 'FRIENDSHIP',
            status: 'PENDIENTE',
            requesterUuid: 'friend-1',
            requesterAlias: 'Alex',
            targetUuid: playerUuid,
            targetAlias: 'Yo',
            createdAt: '2026-06-15T10:00:00.000Z',
          },
        ],
        teamInvites: [],
        matchInvites: [
          {
            id: 2,
            type: 'MATCH_INVITE',
            status: 'ACEPTADA',
            requesterUuid: 'captain-1',
            requesterAlias: 'Capi',
            targetUuid: playerUuid,
            targetAlias: 'Yo',
            matchId: 42,
            teamId: 7,
            createdAt: '2026-06-15T10:05:00.000Z',
          },
        ],
        notifications: [
          {
            id: 3,
            type: 'INVITACION_EQUIPO',
            title: 'Te invitaron',
            message: 'Nuevo equipo',
            contextType: 'TEAM',
            contextId: 7,
            read: false,
            createdAt: '2026-06-15T10:10:00.000Z',
          },
        ],
        activeMatches: [match({ id: 'local-1', backendMatchId: 99, status: MatchStatus.LIVE })],
      },
      playerUuid,
      '2026-06-15T10:15:00.000Z',
    );

    expect(items.map((item) => item.type)).toEqual([
      ActivityType.FRIEND_REQUEST_RECEIVED,
      ActivityType.MATCH_INVITE_ACCEPTED,
      ActivityType.TEAM_INVITE_RECEIVED,
      ActivityType.MATCH_CONFIRMED,
    ]);
    expect(items[0].actions.map((action) => action.type)).toEqual(['ACCEPT', 'REJECT']);
    expect(items[1].target).toEqual(jasmine.objectContaining({ matchId: 42, teamId: 7, requestId: 2 }));
    expect(items[2].target).toEqual(jasmine.objectContaining({ notificationId: 3, teamId: 7 }));
    expect(items[3].title).toBe('Partido en juego');
    expect(items[3].target.matchId).toBe(99);
  });

  it('deduplicates by id and groups related match invites', () => {
    const duplicate = {
      id: 'match-1',
      type: ActivityType.MATCH_INVITE_RECEIVED,
      createdAt: '2026-06-15T10:00:00.000Z',
      isRead: false,
      priority: 'HIGH' as const,
      actor: { name: 'Alex' },
      target: { matchId: 42 },
      payload: {},
      actions: [],
      title: 'Invitacion',
      subtitle: 'Uno',
    };
    const related = {
      ...duplicate,
      id: 'match-2',
      createdAt: '2026-06-15T10:01:00.000Z',
      actor: { name: 'Sam' },
    };

    const unique = dedupeActivityById([duplicate, { ...duplicate, subtitle: 'Reemplazado' }, related]);
    const grouped = groupSimilarActivityEvents(unique);

    expect(unique).toHaveSize(2);
    expect(unique[0].subtitle).toBe('Reemplazado');
    expect(grouped).toHaveSize(1);
    expect(grouped[0].groupCount).toBe(2);
    expect(grouped[0].subtitle).toBe('2 jugadores relacionados con este partido.');
  });
});

function match(overrides: Partial<Match>): Match {
  return {
    id: 'match-1',
    creatorUuid: 'creator-1',
    creatorName: 'Creator',
    type: MatchType.FRIENDLY,
    modality: MatchSize.FIVE_VS_FIVE,
    genderCategory: MatchGenderCategory.MIXED,
    status: MatchStatus.CREATED,
    team: { id: 1, name: 'Equipo' },
    location: 'Cancha',
    scheduledAt: '2026-06-15T12:00:00.000Z',
    invitedCount: 0,
    minRequired: 10,
    homePlayers: [],
    awayPlayers: [],
    createdAt: '2026-06-15T09:00:00.000Z',
    ...overrides,
  };
}
