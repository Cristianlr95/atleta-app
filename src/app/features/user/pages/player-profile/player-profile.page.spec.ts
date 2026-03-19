import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { MatchHistoryViewItem } from 'src/app/features/matches/services/match-history.service';
import { MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { PlayerPositionStateService } from '../../services/player-position-state.service';
import { UserApiService } from '../../services/user-api.service';
import { PlayerProfilePage } from './player-profile.page';

describe('PlayerProfilePage', () => {
  let component: PlayerProfilePage;
  let fixture: ComponentFixture<PlayerProfilePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfilePage],
      providers: [
        provideAppConfigMock(),
        ...provideHttpTesting(),
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: null,
          },
        },
        {
          provide: UserApiService,
          useValue: {
            getPlayerProfile: () => of(null),
          },
        },
        {
          provide: RatingsApiService,
          useValue: {
            getOverall: () => of(null),
            getByRole: () => of([]),
          },
        },
        {
          provide: MatchHistoryService,
          useValue: {
            getPlayerHistory: () => of([]),
          },
        },
        {
          provide: PlayerPositionStateService,
          useValue: {
            getByPlayer: () => [],
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps Partidos Jugados aligned with victories, draws and losses', () => {
    const history: MatchHistoryViewItem[] = [
      buildHistoryItem(1, 'GANADO'),
      buildHistoryItem(2, 'EMPATADO'),
      buildHistoryItem(3, 'PERDIDO'),
      buildHistoryItem(4, null),
    ];

    (component as any).applyProfileData(
      'Jugador',
      'demo@atleta.cl',
      null,
      {
        playerProfileId: 'ath-1',
        alias: 'Demo',
        hybridOVR: 68.1,
        weightedOVR: 68.1,
        simpleOVR: 68.1,
        classification: 'Avanzado',
        versatilityIndex: 0.11,
        consistencyScore: 0.5,
        bestRole: 'ATAQUE',
        bestRoleRating: 79,
        totalRatings: 3,
        totalMatchesPlayed: 99,
        roleBreakdown: {
          ATAQUE: 79,
          MEDIOCAMPO: 60,
          CARRILERO: 50,
          DEFENSA: 48,
          ARQUERO: 30,
          DT: 40,
        },
      },
      [],
      history,
      [],
      [],
    );

    const played = Number(component.summaryStats.find((stat) => stat.label === 'Partidos Jugados')?.value);
    const totalOutcomes = component.outcomeStats.reduce((sum, stat) => sum + Number(stat.value), 0);

    expect(played).toBe(3);
    expect(played).toBe(totalOutcomes);
  });
});

function buildHistoryItem(
  id: number,
  outcome: MatchHistoryViewItem['outcome'],
): MatchHistoryViewItem {
  return {
    id,
    scheduledAtEpoch: null,
    modality: 'CINCO_VS_CINCO',
    status: 'FINALIZADO',
    displayStatusKey: 'FINISHED',
    modalityLabel: '5 vs 5',
    dateLabel: '2026-03-19',
    statusLabel: 'Finalizado',
    outcome,
    teamLabel: 'Demo',
    positionLabel: 'Ataque',
    minutesPlayedLabel: '60',
    goals: 0,
    assists: 0,
    matchRatingLabel: '70.0',
    mvpLabel: 'No',
    scoreLabel: '1 - 0',
  };
}
