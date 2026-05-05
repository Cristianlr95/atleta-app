import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MatchHistoryService, MatchHistoryViewItem } from 'src/app/features/matches/services/match-history.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { StatsPage } from './stats.page';

describe('StatsPage', () => {
  let component: StatsPage;
  let fixture: ComponentFixture<StatsPage>;
  let ratingsApiService: jasmine.SpyObj<RatingsApiService>;
  let matchHistoryService: jasmine.SpyObj<MatchHistoryService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let notificationBadgeService: jasmine.SpyObj<NotificationBadgeService>;
  let authSessionService: { currentSession: unknown };

  beforeEach(async () => {
    ratingsApiService = jasmine.createSpyObj<RatingsApiService>('RatingsApiService', [
      'getOverall',
      'getByRole',
    ]);
    matchHistoryService = jasmine.createSpyObj<MatchHistoryService>('MatchHistoryService', [
      'getPlayerHistory',
    ]);
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', ['safeNavigate']);
    notificationBadgeService = jasmine.createSpyObj<NotificationBadgeService>('NotificationBadgeService', [
      'refresh',
      'totalPending',
    ]);
    authSessionService = {
      currentSession: {
        user: {
          atletaUuid: 'ath-1',
          nombre: 'Demo',
          email: 'demo@atleta.cl',
        },
      },
    };

    ratingsApiService.getOverall.and.returnValue(of({
      playerProfileId: 'ath-1',
      alias: 'Demo',
      hybridOVR: 78.4,
      weightedOVR: 78.4,
      simpleOVR: 77,
      classification: 'Avanzado',
      versatilityIndex: 0.5,
      consistencyScore: 0.72,
      bestRole: 'ATAQUE',
      bestRoleRating: 82,
      totalRatings: 4,
      totalMatchesPlayed: 6,
      roleBreakdown: {
        ATAQUE: 82,
        MEDIOCAMPO: 74,
        CARRILERO: 68,
        DEFENSA: 61,
        ARQUERO: 40,
        DT: 55,
      },
    }));
    ratingsApiService.getByRole.and.returnValue(of([
      {
        id: 1,
        playerProfileId: 'ath-1',
        alias: 'Demo',
        roleType: 'ATAQUE',
        priorityLevel: 'PRINCIPAL',
        currentRating: 82,
        matchesPlayed: 4,
        lastUpdated: '2026-05-01T10:00:00Z',
      },
    ]));
    matchHistoryService.getPlayerHistory.and.returnValue(of([
      buildHistoryItem(1, 'GANADO', 2, 1, 'Si'),
      buildHistoryItem(2, 'PERDIDO', 0, 1, 'No'),
      buildHistoryItem(3, 'EMPATADO', 1, 0, 'No'),
    ]));
    navigationService.safeNavigate.and.resolveTo(true);
    notificationBadgeService.refresh.and.resolveTo();
    notificationBadgeService.totalPending.and.returnValue(2);

    await TestBed.configureTestingModule({
      imports: [StatsPage],
      providers: [
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: RatingsApiService, useValue: ratingsApiService },
        { provide: MatchHistoryService, useValue: matchHistoryService },
        { provide: NavigationService, useValue: navigationService },
        { provide: NotificationBadgeService, useValue: notificationBadgeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsPage);
    component = fixture.componentInstance;
  });

  it('loads read-only stats from ratings and match history', () => {
    component.ionViewWillEnter();

    expect(ratingsApiService.getOverall).toHaveBeenCalledOnceWith('ath-1');
    expect(matchHistoryService.getPlayerHistory).toHaveBeenCalledOnceWith('ath-1');
    expect(component.summaryStats[0].value).toBe('78.4');
    expect(component.summaryStats[1].value).toBe('Ataque 82.0');
    expect(component.summaryStats[2].value).toBe('33%');
    expect(component.summaryStats[3].value).toBe(5);
    expect(component.roleStats.length).toBe(6);
    expect(component.recentMatches.length).toBe(3);
    expect(component.insight).toContain('1V 1E 1D');
  });

  it('shows a session error without calling APIs when there is no session', () => {
    authSessionService.currentSession = null;

    component.ionViewWillEnter();

    expect(component.errorMessage).toBe('No se encontro una sesion valida.');
    expect(ratingsApiService.getOverall).not.toHaveBeenCalled();
  });

  it('routes leaderboard CTA through NavigationService', () => {
    component.onOpenLeaderboard();

    expect(navigationService.safeNavigate).toHaveBeenCalledWith(['/leaderboard']);
  });

  it('keeps bottom nav badge from notification service', () => {
    const matchesItem = component.bottomNavItems.find((item) => item.id === 'matches');

    expect(matchesItem?.badgeCount).toBe(2);
  });
});

function buildHistoryItem(
  id: number,
  outcome: MatchHistoryViewItem['outcome'],
  goals: number,
  assists: number,
  mvpLabel: string,
): MatchHistoryViewItem {
  return {
    id,
    scheduledAtEpoch: new Date(`2026-05-0${id}T20:00:00`).getTime(),
    modality: 'CINCO_VS_CINCO',
    status: 'FINALIZADO',
    displayStatusKey: 'FINISHED',
    modalityLabel: '5 vs 5',
    dateLabel: `0${id}/05/2026`,
    statusLabel: 'Finalizado',
    outcome,
    teamLabel: 'Demo FC',
    positionLabel: 'Ataque',
    minutesPlayedLabel: '60',
    goals,
    assists,
    matchRatingLabel: '78.0',
    mvpLabel,
    scoreLabel: '3 - 2',
  };
}
