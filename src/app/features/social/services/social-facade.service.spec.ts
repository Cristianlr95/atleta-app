import { signal } from '@angular/core';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { MatchStore } from 'src/app/features/matches/stores/match.store';
import { ActivityService } from '../activity/services/activity.service';
import { SocialFacadeService } from './social-facade.service';

describe('SocialFacadeService', () => {
  let activityService: jasmine.SpyObj<ActivityService>;
  let facade: SocialFacadeService;

  beforeEach(() => {
    activityService = buildActivityServiceMock();
    facade = new SocialFacadeService(
      activityService,
      {
        currentSession: {
          user: {
            atletaUuid: 'me',
          },
        },
      } as AuthSessionService,
      {
        optimisticPatchByBackendMatchId: jasmine.createSpy('optimisticPatchByBackendMatchId'),
        refreshByBackendMatchId: jasmine.createSpy('refreshByBackendMatchId').and.resolveTo(),
      } as unknown as MatchStore,
      {
        toUserMessage: jasmine.createSpy('toUserMessage').and.returnValue('No se pudo completar la accion.'),
      } as unknown as ErrorMapperService,
    );
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
