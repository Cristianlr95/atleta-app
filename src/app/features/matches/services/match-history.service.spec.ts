import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { RatingHistoryEntry } from '../../ratings/models/rating.models';
import { RatingsApiService } from '../../ratings/services/ratings-api.service';
import { MatchesApiService } from './matches-api.service';
import { MatchHistoryService } from './match-history.service';
import { SocialApiService } from '../../social/services/social-api.service';

describe('MatchHistoryService', () => {
  let service: MatchHistoryService;
  let matchesApiService: jasmine.SpyObj<MatchesApiService>;
  let ratingsApiService: jasmine.SpyObj<RatingsApiService>;

  beforeEach(() => {
    matchesApiService = jasmine.createSpyObj<MatchesApiService>('MatchesApiService', [
      'getByPlayerOrCreator',
      'getByPlayer',
      'getById',
    ]);
    ratingsApiService = jasmine.createSpyObj<RatingsApiService>('RatingsApiService', ['getHistory']);

    TestBed.configureTestingModule({
      providers: [
        MatchHistoryService,
        { provide: MatchesApiService, useValue: matchesApiService },
        { provide: RatingsApiService, useValue: ratingsApiService },
        {
          provide: SocialApiService,
          useValue: {
            getMatchInvites: () => of([]),
          },
        },
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: {
              user: {
                atletaUuid: 'ath-1',
                email: 'demo@atleta.cl',
                nombre: 'Demo',
              },
              tokens: {
                accessToken: 'token',
              },
            },
          },
        },
      ],
    });

    service = TestBed.inject(MatchHistoryService);
  });

  it('does not count invalid matches as outcomes even if they have result data', (done) => {
    matchesApiService.getByPlayerOrCreator.and.returnValue(
      of([
        {
          id: 10,
          modalidad: 'CINCO_VS_CINCO',
          fechaHoraProgramada: '2026-03-19T10:00:00',
          estado: 'INVALIDO',
          resultado: 'GANADO',
          finalScoreLocal: 3,
          finalScoreAway: 1,
          players: [],
        },
      ]),
    );
    ratingsApiService.getHistory.and.returnValue(of([buildRatingHistory(10, 'GANADO')]));

    service.getPlayerHistory('ath-1').subscribe((history) => {
      expect(history[0].status).toBe('INVALIDO');
      expect(history[0].outcome).toBeNull();
      done();
    });
  });

  it('keeps finalized matches countable as outcomes', (done) => {
    matchesApiService.getByPlayerOrCreator.and.returnValue(
      of([
        {
          id: 11,
          modalidad: 'CINCO_VS_CINCO',
          fechaHoraProgramada: '2026-03-19T10:00:00',
          estado: 'FINALIZADO',
          resultado: 'GANADO',
          finalScoreLocal: 3,
          finalScoreAway: 1,
          players: [],
        },
      ]),
    );
    ratingsApiService.getHistory.and.returnValue(of([buildRatingHistory(11, 'GANADO')]));

    service.getPlayerHistory('ath-1').subscribe((history) => {
      expect(history[0].outcome).toBe('GANADO');
      done();
    });
  });
});

function buildRatingHistory(matchId: number, matchResult: RatingHistoryEntry['matchResult']): RatingHistoryEntry {
  return {
    id: matchId,
    playerProfileId: 'ath-1',
    roleType: 'ATAQUE',
    priorityLevel: 'PRINCIPAL',
    matchId,
    newRating: 70,
    goalsScored: 1,
    assistsMade: 0,
    wasMvp: false,
    matchResult,
    createdAt: '2026-03-19T10:00:00Z',
  };
}
