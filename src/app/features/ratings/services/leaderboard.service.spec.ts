import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { RatingsApiService } from './ratings-api.service';
import { LeaderboardService } from './leaderboard.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let teamApiService: jasmine.SpyObj<TeamApiService>;
  let ratingsApiService: jasmine.SpyObj<RatingsApiService>;

  beforeEach(() => {
    teamApiService = jasmine.createSpyObj<TeamApiService>('TeamApiService', ['getLeaderboard']);
    ratingsApiService = jasmine.createSpyObj<RatingsApiService>('RatingsApiService', [
      'getLeaderboardOverall', 'getLeaderboardByRole', 'getOverall',
    ]);
    TestBed.configureTestingModule({ providers: [
      LeaderboardService,
      { provide: TeamApiService, useValue: teamApiService },
      { provide: RatingsApiService, useValue: ratingsApiService },
    ] });
    service = TestBed.inject(LeaderboardService);
  });

  it('uses the authorized aggregate endpoint without per-player OVR requests', () => {
    teamApiService.getLeaderboard.and.returnValue(of([
      { rank: 1, playerProfileId: 'alpha', alias: 'Alpha', score: 82.5, matchesPlayed: 9, rated: true },
      { rank: 2, playerProfileId: 'beta', alias: 'Beta', score: null, matchesPlayed: 0, rated: false },
    ]));

    service.getTeamOverallLeaderboard(77).subscribe((rows) => expect(rows).toEqual([
      { rank: 1, playerProfileId: 'alpha', alias: 'Alpha', scoreText: '82.5 OVR', metaText: '9 partidos', matchesPlayed: 9 },
      { rank: 2, playerProfileId: 'beta', alias: 'Beta', scoreText: 'Sin rating', metaText: 'Aun sin partidos puntuados', matchesPlayed: 0 },
    ]));

    expect(teamApiService.getLeaderboard).toHaveBeenCalledOnceWith(77);
    expect(ratingsApiService.getOverall).not.toHaveBeenCalled();
  });

  it('keeps backend tie ranks instead of recalculating them', () => {
    teamApiService.getLeaderboard.and.returnValue(of([
      { rank: 1, playerProfileId: 'alpha', alias: 'Alpha', score: 80, matchesPlayed: 3, rated: true },
      { rank: 1, playerProfileId: 'beta', alias: 'Beta', score: 80, matchesPlayed: 4, rated: true },
    ]));

    service.getTeamOverallLeaderboard(77).subscribe((rows) =>
      expect(rows.map((row) => row.rank)).toEqual([1, 1]));
  });
});
