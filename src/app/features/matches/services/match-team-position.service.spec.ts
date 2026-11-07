import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TeamActiveMember } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { MatchTeamPositionService } from './match-team-position.service';

describe('MatchTeamPositionService', () => {
  let service: MatchTeamPositionService;
  let teamApiService: jasmine.SpyObj<TeamApiService>;

  beforeEach(() => {
    teamApiService = jasmine.createSpyObj<TeamApiService>('TeamApiService', ['getActiveMembers']);

    TestBed.configureTestingModule({
      providers: [
        MatchTeamPositionService,
        { provide: TeamApiService, useValue: teamApiService },
      ],
    });

    service = TestBed.inject(MatchTeamPositionService);
  });

  it('returns empty map when team id is missing', async () => {
    await expectAsync(service.fetchTeamPositionMap(0)).toBeResolvedTo({});
    expect(teamApiService.getActiveMembers).not.toHaveBeenCalled();
  });

  it('maps members to primary position names', async () => {
    teamApiService.getActiveMembers.and.returnValue(
      of([
        member({ playerUuid: 'player-1', primaryPositionName: 'Defensa' }),
        member({ playerUuid: 'player-2', primaryPositionName: null }),
      ]),
    );

    await expectAsync(service.fetchTeamPositionMap(7)).toBeResolvedTo({
      'player-1': 'Defensa',
      'player-2': 'Sin posicion',
    });
  });

  it('returns empty map when api call fails', async () => {
    teamApiService.getActiveMembers.and.returnValue(throwError(() => new Error('network')));

    await expectAsync(service.fetchTeamPositionMap(7)).toBeResolvedTo({});
  });
});

function member(overrides: Partial<TeamActiveMember>): TeamActiveMember {
  return {
    playerUuid: 'player-1',
    alias: 'Jugador',
    rol: 'JUGADOR',
    primaryPositionId: 1,
    primaryPositionName: 'Delantero',
    ...overrides,
  };
}
