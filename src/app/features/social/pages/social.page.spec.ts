import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchStatus } from 'src/app/features/matches/models/progressive-match.models';
import { MatchService } from 'src/app/features/matches/services/match.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { SocialFacadeService, SocialTabId } from '../services/social-facade.service';
import { SocialPage } from './social.page';

describe('SocialPage', () => {
  let component: SocialPage;
  let fixture: ComponentFixture<SocialPage>;
  let facade: ReturnType<typeof buildSocialFacadeMock>;
  let routeSnapshot: {
    queryParamMap: { get: jasmine.Spy<(key: string) => string | null> };
    data: Record<string, unknown>;
  };
  let navigationService: jasmine.SpyObj<NavigationService>;
  let notificationBadgeService: ReturnType<typeof buildNotificationBadgeMock>;

  beforeEach(async () => {
    facade = buildSocialFacadeMock();
    routeSnapshot = {
      queryParamMap: {
        get: jasmine.createSpy('get').and.returnValue(null),
      },
      data: {},
    };
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', [
      'safeNavigate',
      'safeNavigateByUrl',
      'goToMainBottomSection',
    ]);
    navigationService.safeNavigate.and.resolveTo(true);
    navigationService.safeNavigateByUrl.and.resolveTo(true);
    navigationService.goToMainBottomSection.and.resolveTo(true);
    notificationBadgeService = buildNotificationBadgeMock();

    await TestBed.configureTestingModule({
      imports: [SocialPage],
      providers: [
        {
          provide: SocialFacadeService,
          useValue: facade,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: routeSnapshot,
          },
        },
        {
          provide: NavigationService,
          useValue: navigationService,
        },
        {
          provide: NotificationBadgeService,
          useValue: notificationBadgeService,
        },
        {
          provide: MatchService,
          useValue: {
            activeMatches: signal([
              {
                id: 'local-10',
                backendMatchId: 10,
                status: MatchStatus.CONFIRMED,
                scheduledAt: '2026-05-05T20:00:00',
                team: { name: 'Rojo' },
              },
              {
                id: 'local-11',
                backendMatchId: 11,
                status: MatchStatus.FINISHED,
                scheduledAt: '2026-05-06T20:00:00',
                team: { name: 'Azul' },
              },
            ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SocialPage);
    component = fixture.componentInstance;
  });

  it('loads the route default social tab on enter', async () => {
    routeSnapshot.data['defaultSocialTab'] = 'matches';

    await (component as unknown as { loadOnEnter: () => Promise<void> }).loadOnEnter();

    expect(facade.setActiveTab).toHaveBeenCalledOnceWith('matches');
    expect(facade.initialize).toHaveBeenCalledTimes(1);
    expect(notificationBadgeService.refresh).toHaveBeenCalledTimes(1);
  });

  it('uses query param tab before route data', async () => {
    routeSnapshot.queryParamMap.get.and.returnValue('friends');
    routeSnapshot.data['defaultSocialTab'] = 'matches';

    await (component as unknown as { loadOnEnter: () => Promise<void> }).loadOnEnter();

    expect(facade.setActiveTab).toHaveBeenCalledOnceWith('friends');
  });

  it('ignores invalid tab query params', async () => {
    routeSnapshot.queryParamMap.get.and.returnValue('unknown');

    await (component as unknown as { loadOnEnter: () => Promise<void> }).loadOnEnter();

    expect(facade.setActiveTab).not.toHaveBeenCalled();
    expect(facade.initialize).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent enter loads', async () => {
    let resolveInitialize: (() => void) | undefined;
    facade.initialize.and.returnValue(new Promise<void>((resolve) => {
      resolveInitialize = resolve;
    }));

    const firstLoad = (component as unknown as { loadOnEnter: () => Promise<void> }).loadOnEnter();
    const secondLoad = (component as unknown as { loadOnEnter: () => Promise<void> }).loadOnEnter();

    expect(facade.initialize).toHaveBeenCalledTimes(1);
    resolveInitialize?.();
    await Promise.all([firstLoad, secondLoad]);
    expect(notificationBadgeService.refresh).toHaveBeenCalledTimes(1);
  });

  it('exposes only confirmed or live matches to the invitations panel', () => {
    expect(component.confirmedMatches()).toEqual([
      {
        id: 10,
        title: 'Rojo confirmado',
        scheduledAt: '2026-05-05T20:00:00',
      },
    ]);
  });

  it('keeps main bottom nav social badge aligned with pending and unread counts', () => {
    notificationBadgeService.totalPending.set(2);
    facade.unreadCount.set(3);

    const matchesItem = component.bottomNavItems.find((item) => item.id === 'matches');

    expect(matchesItem?.badgeCount).toBe(5);
  });

  it('routes bottom nav actions through NavigationService', () => {
    component.onNavItemSelected('home');
    component.onNavItemSelected('matches');
    component.onNavItemSelected('ranking');
    component.onNavItemSelected('profile');

    expect(navigationService.goToMainBottomSection).toHaveBeenCalledWith('home');
    expect(navigationService.goToMainBottomSection).toHaveBeenCalledWith('matches');
    expect(navigationService.goToMainBottomSection).toHaveBeenCalledWith('ranking');
    expect(navigationService.goToMainBottomSection).toHaveBeenCalledWith('profile');
  });
});

function buildSocialFacadeMock() {
  const activeTab = signal<SocialTabId>('activity');
  const unreadCount = signal(0);
  const facade = {
    activeTab: activeTab.asReadonly(),
    isLoading: signal(false).asReadonly(),
    activity: signal([]).asReadonly(),
    unreadCount: unreadCount.asReadonly(),
    teams: signal([]).asReadonly(),
    friendships: signal([]).asReadonly(),
    teamInvites: signal([]).asReadonly(),
    matchInvites: signal([]).asReadonly(),
    pendingFriends: signal([]).asReadonly(),
    pendingTeamInvites: signal([]).asReadonly(),
    pendingMatchInvites: signal([]).asReadonly(),
    createdTeams: signal([]).asReadonly(),
    friendCandidates: signal([]).asReadonly(),
    inviteCandidates: signal([]).asReadonly(),
    searchLoading: signal(false).asReadonly(),
    errorMessage: signal(null).asReadonly(),
    successMessage: signal(null).asReadonly(),
    initialize: jasmine.createSpy('initialize').and.resolveTo(),
    setActiveTab: jasmine.createSpy('setActiveTab').and.callFake((tab: SocialTabId) => activeTab.set(tab)),
    markActivityRead: jasmine.createSpy('markActivityRead').and.resolveTo(),
    markAllActivityRead: jasmine.createSpy('markAllActivityRead').and.resolveTo(),
    searchFriendCandidates: jasmine.createSpy('searchFriendCandidates').and.resolveTo(),
    searchInviteCandidates: jasmine.createSpy('searchInviteCandidates').and.resolveTo(),
    sendFriendRequest: jasmine.createSpy('sendFriendRequest').and.resolveTo(),
    respondFriendRequest: jasmine.createSpy('respondFriendRequest').and.resolveTo(),
    respondTeamInvite: jasmine.createSpy('respondTeamInvite').and.resolveTo(),
    respondMatchInvite: jasmine.createSpy('respondMatchInvite').and.resolveTo(),
    sendTeamInvite: jasmine.createSpy('sendTeamInvite').and.resolveTo(),
    deleteTeam: jasmine.createSpy('deleteTeam').and.resolveTo(),
  };

  return {
    ...facade,
    unreadCount,
  } as unknown as typeof facade & { unreadCount: typeof unreadCount };
}

function buildNotificationBadgeMock() {
  const totalPending = signal(0);

  return {
    totalPending,
    refresh: jasmine.createSpy('refresh').and.resolveTo(),
  };
}
