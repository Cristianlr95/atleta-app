import { signal } from '@angular/core';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { MatchStore } from 'src/app/features/matches/stores/match.store';
import { PlayerMatchHistoryItem } from 'src/app/features/matches/models/match.models';
import { MatchesApiService } from 'src/app/features/matches/services/matches-api.service';
import { ActivityService } from '../activity/services/activity.service';
import { SocialFacadeService } from './social-facade.service';

describe('SocialFacadeService', () => {
  let activityService: jasmine.SpyObj<ActivityService>;
  let facade: SocialFacadeService;
  let matchesApi: jasmine.SpyObj<MatchesApiService>;
  let matchStore: jasmine.SpyObj<MatchStore>;

  beforeEach(() => {
    activityService = buildActivityServiceMock();
    matchesApi = jasmine.createSpyObj<MatchesApiService>('MatchesApiService', ['getByPlayerOrCreator']);
    matchesApi.getByPlayerOrCreator.and.returnValue(of([]));
    matchStore = jasmine.createSpyObj<MatchStore>('MatchStore', ['optimisticPatchByBackendMatchId', 'refreshByBackendMatchId', 'refresh']);
    matchStore.refresh.and.resolveTo(null);
    TestBed.configureTestingModule({
      providers: [
        SocialFacadeService,
        { provide: ActivityService, useValue: activityService },
        {
          provide: AuthSessionService,
          useValue: {
        currentSession: {
          user: {
            atletaUuid: 'me',
          },
        },
          } as AuthSessionService,
        },
        {
          provide: MatchStore,
          useValue: matchStore,
        },
        { provide: MatchesApiService, useValue: matchesApi },
        {
          provide: ErrorMapperService,
          useValue: {
            toUserMessage: jasmine.createSpy('toUserMessage').and.returnValue('No se pudo completar la accion.'),
          } as unknown as ErrorMapperService,
        },
      ],
    });
    facade = TestBed.inject(SocialFacadeService);
  });

  it('shows full and live matches but not partial or finished matches', async () => {
    const full = { id: 12, estado: 'CREADO', modalidad: 'CINCO_VS_CINCO', fechaHoraProgramada: '2030-01-01T12:00:00', players: Array.from({ length: 10 }, () => ({ confirmado: true })) };
    const partial = { ...full, id: 13, players: full.players.slice(0, 2) };
    const live = { ...partial, id: 14, estado: 'INICIADO' };
    const finished = { ...full, id: 15, estado: 'FINALIZADO' };
    matchesApi.getByPlayerOrCreator.and.returnValue(of([full, partial, live, finished] as unknown as PlayerMatchHistoryItem[]));

    await facade.initialize();

    expect(matchesApi.getByPlayerOrCreator).toHaveBeenCalledOnceWith('me');
    expect(facade.confirmedMatches().map(match => match.id)).toEqual([12, 14]);
    expect(matchStore.refresh).not.toHaveBeenCalled();
  });

  it('loads a large list of full matches', async () => {
    const matches = Array.from({ length: 20 }, (_, index) => ({ id: index + 1, estado: 'CREADO', modalidad: 'CINCO_VS_CINCO', fechaHoraProgramada: '2030-01-01T12:00:00', players: Array.from({ length: 10 }, () => ({ confirmado: true })) })) as unknown as PlayerMatchHistoryItem[];
    matchesApi.getByPlayerOrCreator.and.returnValue(of(matches));
    await facade.initialize();
    expect(matchesApi.getByPlayerOrCreator).toHaveBeenCalledTimes(1);
    expect(facade.confirmedMatches().length).toBe(20);
    expect(matchStore.refresh).not.toHaveBeenCalled();
  });

  it('clears stale friend candidates when search fails', async () => {
    activityService.searchPlayers.and.resolveTo([{ atletaUuid: 'friend', alias: 'Nueve' }]);
    await facade.searchFriendCandidates('nueve');
    expect(facade.friendCandidates().length).toBe(1);

    activityService.searchPlayers.and.rejectWith(new Error('boom'));
    await facade.searchFriendCandidates('arquero');

    expect(facade.friendCandidates()).toEqual([]);
    expect(facade.errorMessage()).toBe('No se pudo completar la accion.');
  });

  it('clears stale team invite candidates when search fails', async () => {
    activityService.searchPlayers.and.resolveTo([{ atletaUuid: 'target', alias: 'Diez' }]);
    await facade.searchInviteCandidates('diez');
    expect(facade.inviteCandidates().length).toBe(1);

    activityService.searchPlayers.and.rejectWith(new Error('boom'));
    await facade.searchInviteCandidates('lateral');

    expect(facade.inviteCandidates()).toEqual([]);
    expect(facade.errorMessage()).toBe('No se pudo completar la accion.');
  });
});

function buildActivityServiceMock(): jasmine.SpyObj<ActivityService> {
  const empty = signal([]);
  return {
    loading: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    activity: empty.asReadonly(),
    unreadCount: signal(0).asReadonly(),
    teams: empty.asReadonly(),
    friendships: empty.asReadonly(),
    teamInvites: empty.asReadonly(),
    matchInvites: empty.asReadonly(),
    notifications: empty.asReadonly(),
    fetchActivity: jasmine.createSpy('fetchActivity').and.resolveTo(),
    markAsRead: jasmine.createSpy('markAsRead').and.resolveTo(),
    markAllRead: jasmine.createSpy('markAllRead').and.resolveTo(),
    sendFriendRequest: jasmine.createSpy('sendFriendRequest').and.resolveTo(),
    respondFriendRequest: jasmine.createSpy('respondFriendRequest').and.resolveTo(),
    sendTeamInvite: jasmine.createSpy('sendTeamInvite').and.resolveTo(),
    respondTeamInvite: jasmine.createSpy('respondTeamInvite').and.resolveTo(),
    deleteTeam: jasmine.createSpy('deleteTeam').and.resolveTo(),
    sendMatchInvite: jasmine.createSpy('sendMatchInvite').and.resolveTo(),
    respondMatchInvite: jasmine.createSpy('respondMatchInvite').and.resolveTo(),
    searchPlayers: jasmine.createSpy('searchPlayers'),
  } as unknown as jasmine.SpyObj<ActivityService>;
}
