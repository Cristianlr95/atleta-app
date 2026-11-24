import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RatingByRole } from 'src/app/features/ratings/models/rating.models';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { MatchHistoryViewItem } from 'src/app/features/matches/services/match-history.service';
import { MatchType } from 'src/app/features/matches/models/progressive-match.models';
import { MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { PlayerProfile } from '../../models/user.models';
import { PlayerPositionStateService } from '../../services/player-position-state.service';
import { UserApiService } from '../../services/user-api.service';
import { PlayerProfilePage } from './player-profile.page';

describe('PlayerProfilePage', () => {
  let component: PlayerProfilePage;
  let fixture: ComponentFixture<PlayerProfilePage>;
  let authSessionService: { currentSession: unknown };
  let userApiService: jasmine.SpyObj<UserApiService>;
  let appToastService: jasmine.SpyObj<AppToastService>;
  let ratingsApiService: jasmine.SpyObj<RatingsApiService>;

  beforeEach(async () => {
    authSessionService = {
      currentSession: null,
    };
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', [
      'getPlayerProfile',
      'changePassword',
      'getPlayerAchievements',
      'getPlayerPositions',
    ]);
    userApiService.getPlayerProfile.and.returnValue(of({} as PlayerProfile));
    userApiService.changePassword.and.returnValue(of(void 0));
    userApiService.getPlayerAchievements.and.returnValue(of([]));
    userApiService.getPlayerPositions.and.returnValue(of([]));
    ratingsApiService = jasmine.createSpyObj<RatingsApiService>('RatingsApiService', ['getOverall', 'getByRole']);
    ratingsApiService.getOverall.and.returnValue(throwError(() => ({ status: 404 })));
    ratingsApiService.getByRole.and.returnValue(of([]));
    appToastService = jasmine.createSpyObj<AppToastService>('AppToastService', ['success', 'error', 'info']);
    appToastService.success.and.resolveTo();
    appToastService.error.and.resolveTo();
    appToastService.info.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [PlayerProfilePage],
      providers: [
        provideAppConfigMock(),
        ...provideHttpTesting(),
        {
          provide: AuthSessionService,
          useValue: authSessionService,
        },
        {
          provide: UserApiService,
          useValue: userApiService,
        },
        {
          provide: AppToastService,
          useValue: appToastService,
        },
        {
          provide: RatingsApiService,
          useValue: ratingsApiService,
        },
        { provide: NotificationBadgeService, useValue: { totalPending: () => 0, refresh: async () => undefined } },
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

  it('no muestra métricas provisionales mientras carga el perfil', () => {
    component.isLoading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.player-command-center')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Actualizando estadísticas');
  });
  it('no muestra ceros como estadísticas cuando falla el historial', () => {
    authSessionService.currentSession = { user: { atletaUuid: 'ath-1', nombre: 'Ana' } };
    spyOn(TestBed.inject(MatchHistoryService), 'getPlayerHistory').and.returnValue(throwError(() => ({ status: 500 })));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.competition-metrics')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar las estadísticas');
    component.ionViewWillLeave();
  });
  it('no muestra estadísticas de ejemplo en un perfil sin datos', () => {
    expect(component.roleStats).toEqual([]);
    expect(component.achievements).toEqual([]);
    (component as any).applyProfileData('Jugador', 'jugador@atleta.test', null, null, [], [], [], []);
    expect(component.roleStats).toEqual([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay estadísticas');
    expect(fixture.nativeElement.textContent).toContain('No hay trofeos disponibles');
  });
  it('keeps the team section out of Perfil', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-profile-teams')).toBeNull();
  });

  it('does not repeat OVR as a general level', () => {
    component.overallHybridOvr = 68;
    component.roleStats = [{ role: 'ATAQUE', rating: 79 }];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('NIVEL GENERAL');
    expect(fixture.nativeElement.querySelector('.ovr-block')?.textContent).toContain('68');
  });

  it('distinguishes an absent role from a valid zero in the normal API flow', () => {
    authSessionService.currentSession = { user: { atletaUuid: 'ath-1', nombre: 'Ana' } };
    ratingsApiService.getByRole.and.returnValue(of([
      { roleType: 'ATAQUE', currentRating: 79 } as RatingByRole,
      { roleType: 'MEDIOCAMPO', currentRating: 0 } as RatingByRole,
    ]));
    component.ionViewWillEnter();
    fixture.detectChanges();
    const values: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.role-stat-values div'));
    expect(values.find(row => row.textContent?.includes('Mediocampo'))?.textContent).toContain('0');
    expect(values.find(row => row.textContent?.includes('Defensa'))?.textContent).toContain('Sin valoración');
    expect(values.filter(row => row.textContent?.includes('Sin valoración')).length).toBe(4);
    component.ionViewWillLeave();
  });

  it('offers an in-screen retry after HTTP 500 and restores real statistics', async () => {
    authSessionService.currentSession = { user: { atletaUuid: 'ath-1', nombre: 'Ana' } };
    ratingsApiService.getByRole.and.returnValue(throwError(() => ({ status: 500 })));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('No pudimos cargar las estadísticas');
    expect(fixture.nativeElement.textContent).not.toContain('Aún no hay estadísticas');
    ratingsApiService.getByRole.and.returnValue(of([{ roleType: 'ATAQUE', currentRating: 79 } as RatingByRole]));
    const retry = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
      .find(button => button.textContent?.trim() === 'Reintentar estadísticas');
    expect(retry).toBeDefined();
    retry?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.role-stat-values')?.textContent).toContain('79');
    component.ionViewWillLeave();
  });

  it('keeps the competition summary aligned with victories, draws and losses', () => {
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

    const played = component.competition.matches;
    const totalOutcomes = component.competition.wins + component.competition.draws + component.competition.losses;

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
    matchType: MatchType.FRIENDLY,
    typeLabel: 'Amistoso',
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
