import { TestBed } from '@angular/core/testing';
import { Match, MatchGenderCategory, MatchSize, MatchStatus, MatchType, Player } from '../models/progressive-match.models';
import { MatchTeamAssignmentPersistenceService } from './match-team-assignment-persistence.service';

describe('MatchTeamAssignmentPersistenceService', () => {
  let service: MatchTeamAssignmentPersistenceService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatchTeamAssignmentPersistenceService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loads an empty map when storage is missing or invalid', () => {
    expect(service.loadAll()).toEqual({});

    localStorage.setItem('atleta.match.team-assignments.v1', '{bad-json');

    expect(service.loadAll()).toEqual({});
  });

  it('saves assignments and builds deterministic keys', () => {
    service.saveAll({
      'backend-42': {
        homeIds: ['a'],
        awayIds: ['b'],
        updatedAt: '2026-06-15T12:00:00.000Z',
      },
    });

    expect(service.loadAll()['backend-42']).toEqual({
      homeIds: ['a'],
      awayIds: ['b'],
      updatedAt: '2026-06-15T12:00:00.000Z',
    });
    expect(service.keyForBackendMatch(42)).toBe('backend-42');
    expect(service.keyForMatch(match({ backendMatchId: 42 }))).toBe('backend-42');
    expect(service.keyForMatch(match({ id: 'draft-1', backendMatchId: undefined }))).toBe('local-draft-1');
  });

  it('creates snapshots from assigned players', () => {
    const snapshot = service.createSnapshot(
      [player('home-1'), player('home-2')],
      [player('away-1')],
      '2026-06-15T12:00:00.000Z',
    );

    expect(snapshot).toEqual({
      homeIds: ['home-1', 'home-2'],
      awayIds: ['away-1'],
      updatedAt: '2026-06-15T12:00:00.000Z',
    });
  });
});

function player(uuid: string): Player {
  return {
    uuid,
    name: uuid,
    position: 'Delantero',
    role: 'JUGADOR',
  };
}

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
