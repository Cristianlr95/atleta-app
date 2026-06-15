import {
  Match,
  MatchGenderCategory,
  MatchSize,
  MatchStatus,
  MatchType,
  PlayerInvitationStatus,
} from '../models/progressive-match.models';
import { buildConfirmedPlayers, buildMatchProgress } from './match-state-presenter.util';

describe('match-state-presenter util', () => {
  it('builds progress messages for live close pending matches', () => {
    const progress = buildMatchProgress(MatchStatus.LIVE, 10, 10, 10, true);

    expect(progress).toEqual({
      confirmed: 10,
      invited: 10,
      minRequired: 10,
      percentage: 100,
      missing: 0,
      statusMessage: 'Partido terminado. Pendiente cierre de resultados.',
    });
  });

  it('builds missing confirmation progress without exceeding 100 percent', () => {
    const partial = buildMatchProgress(MatchStatus.CREATED, 3, 8, 5);
    const overConfirmed = buildMatchProgress(MatchStatus.CONFIRMED, 8, 8, 5);

    expect(partial.missing).toBe(2);
    expect(partial.percentage).toBe(60);
    expect(partial.statusMessage).toBe('Faltan 2 para confirmar el partido');
    expect(overConfirmed.percentage).toBe(100);
  });

  it('builds confirmed players with participant data and local player fallback', () => {
    const match = buildMatch({
      homePlayers: [
        {
          uuid: 'player-1',
          name: 'Local fallback',
          gender: 'MASCULINO',
          role: 'CAPITAN',
          position: 'Defensa',
          teamId: 10,
          ovr: 77,
        },
      ],
      awayPlayers: [],
    });

    const players = buildConfirmedPlayers(match, [
      {
        userId: 'player-1',
        name: 'Jugador confirmado',
        status: PlayerInvitationStatus.ACCEPTED,
      },
      {
        userId: 'player-2',
        name: 'Sin fallback',
        status: PlayerInvitationStatus.ACCEPTED,
        position: 'Delantero',
      },
    ]);

    expect(players[0]).toEqual({
      uuid: 'player-1',
      name: 'Jugador confirmado',
      gender: 'MASCULINO',
      role: 'CAPITAN',
      position: 'Defensa',
      teamId: 10,
      avatarUrl: undefined,
      ovr: 77,
    });
    expect(players[1].position).toBe('Delantero');
    expect(players[1].role).toBe('JUGADOR');
    expect(players[1].ovr).toBe(65);
  });
});

function buildMatch(overrides: Partial<Match>): Match {
  return {
    id: 'match-1',
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
    ...overrides,
  };
}
