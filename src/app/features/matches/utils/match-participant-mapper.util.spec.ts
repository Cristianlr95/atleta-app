import { SocialRequestItem } from '../../social/models/social.models';
import { MatchResponse } from '../models/match.models';
import {
  Match,
  MatchGenderCategory,
  MatchSize,
  MatchStatus,
  MatchType,
  PlayerInvitationStatus,
} from '../models/progressive-match.models';
import { buildUnifiedMatchParticipants } from './match-participant-mapper.util';

describe('match-participant-mapper util', () => {
  it('merges api players with invites and keeps accepted api status authoritative', () => {
    const match = buildMatch({});
    const response: MatchResponse = {
      id: 10,
      modalidad: 'CINCO_VS_CINCO',
      fechaHoraProgramada: match.scheduledAt,
      estado: 'CREADO',
      players: [
        {
          id: 1,
          rol: 'JUGADOR',
          confirmado: true,
          teamSide: 'LOCAL',
          player: { atletaUuid: 'player-1', alias: 'Api Player', genero: 'MASCULINO' },
          position: { id: 1, nombre: 'Defensa' },
        },
      ],
    };
    const invites: SocialRequestItem[] = [
      buildInvite({ targetUuid: 'player-1', targetAlias: 'Invited Name', status: 'RECHAZADA' }),
      buildInvite({ targetUuid: 'player-2', targetAlias: 'Invite Only', status: 'PENDIENTE' }),
    ];

    const participants = buildUnifiedMatchParticipants(match, response, invites, { 'player-2': 'Delantero' });

    expect(participants).toEqual([
      {
        userId: 'player-1',
        name: 'Invited Name',
        status: PlayerInvitationStatus.ACCEPTED,
        gender: 'MASCULINO',
        position: 'Defensa',
        teamSide: 'HOME',
        kitColor: 'Azul',
      },
      {
        userId: 'player-2',
        name: 'Invite Only',
        status: PlayerInvitationStatus.PENDING,
        gender: undefined,
        position: 'Delantero',
        teamSide: undefined,
      },
      {
        userId: 'creator-1',
        name: 'Creador',
        status: PlayerInvitationStatus.ACCEPTED,
        gender: undefined,
        position: 'Creador',
      },
    ]);
  });

  it('adds creator once and applies local team kit presentation', () => {
    const match = buildMatch({
      homeKitColor: 'Negro',
      creatorUuid: 'creator-1',
      homePlayers: [
        {
          uuid: 'creator-1',
          name: 'Creador local',
          gender: 'FEMENINO',
          role: 'CAPITAN',
          position: 'Medio',
        },
      ],
    });

    const participants = buildUnifiedMatchParticipants(match, null, [], {});

    expect(participants).toEqual([
      {
        userId: 'creator-1',
        name: 'Creador',
        status: PlayerInvitationStatus.ACCEPTED,
        gender: 'FEMENINO',
        position: 'Creador',
        teamSide: 'HOME',
        kitColor: 'Negro',
      },
    ]);
  });
});

function buildInvite(overrides: Partial<SocialRequestItem>): SocialRequestItem {
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

function buildMatch(overrides: Partial<Match>): Match {
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
    homeKitColor: 'Azul',
    awayKitColor: 'Rojo',
    homePlayers: [{ uuid: 'player-1', name: 'Home', position: 'Defensa', role: 'JUGADOR' }],
    awayPlayers: [],
    createdAt: '2026-06-15T10:00:00',
    ...overrides,
  };
}
