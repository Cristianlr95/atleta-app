import { TestBed } from '@angular/core/testing';
import { MatchService } from 'src/app/features/matches/services/match.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { NotificationService } from 'src/app/features/matches/services/notification.service';
import { PushTokenSyncService } from 'src/app/features/matches/services/push-token-sync.service';
import { InvitationsStore } from 'src/app/features/matches/stores/invitations.store';
import { MatchStore } from 'src/app/features/matches/stores/match.store';
import { MvpVoteStore } from 'src/app/features/matches/stores/mvp-vote.store';
import { SocialFacadeService } from 'src/app/features/social/services/social-facade.service';
import { PlayerPositionStateService } from 'src/app/features/user/services/player-position-state.service';
import { SessionDataCleanupService } from './session-data-cleanup.service';

describe('SessionDataCleanupService', () => {
  it('clears runtime state and user-scoped persistence', () => {
    const matchService = jasmine.createSpyObj<MatchService>('MatchService', ['clearSessionState']);
    const matchStore = jasmine.createSpyObj<MatchStore>('MatchStore', ['clear']);
    const mvpVoteStore = jasmine.createSpyObj<MvpVoteStore>('MvpVoteStore', ['clear']);
    const invitationsStore = jasmine.createSpyObj<InvitationsStore>('InvitationsStore', ['clear']);
    const socialFacadeService = jasmine.createSpyObj<SocialFacadeService>('SocialFacadeService', [
      'clearSessionState',
    ]);
    const notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'clear',
    ]);
    const notificationBadgeService = jasmine.createSpyObj<NotificationBadgeService>(
      'NotificationBadgeService',
      ['clear'],
    );
    const playerPositionStateService = jasmine.createSpyObj<PlayerPositionStateService>(
      'PlayerPositionStateService',
      ['clearForPlayer'],
    );
    const pushTokenSyncService = jasmine.createSpyObj<PushTokenSyncService>('PushTokenSyncService', [
      'clearForUser',
    ]);

    TestBed.configureTestingModule({
      providers: [
        SessionDataCleanupService,
        { provide: MatchService, useValue: matchService },
        { provide: MatchStore, useValue: matchStore },
        { provide: MvpVoteStore, useValue: mvpVoteStore },
        { provide: InvitationsStore, useValue: invitationsStore },
        { provide: SocialFacadeService, useValue: socialFacadeService },
        { provide: NotificationService, useValue: notificationService },
        { provide: NotificationBadgeService, useValue: notificationBadgeService },
        { provide: PlayerPositionStateService, useValue: playerPositionStateService },
        { provide: PushTokenSyncService, useValue: pushTokenSyncService },
      ],
    });

    TestBed.inject(SessionDataCleanupService).clear('ath-1');

    expect(matchService.clearSessionState).toHaveBeenCalledTimes(1);
    expect(matchStore.clear).toHaveBeenCalledTimes(1);
    expect(mvpVoteStore.clear).toHaveBeenCalledTimes(1);
    expect(invitationsStore.clear).toHaveBeenCalledTimes(1);
    expect(socialFacadeService.clearSessionState).toHaveBeenCalledTimes(1);
    expect(notificationService.clear).toHaveBeenCalledTimes(1);
    expect(notificationBadgeService.clear).toHaveBeenCalledTimes(1);
    expect(playerPositionStateService.clearForPlayer).toHaveBeenCalledOnceWith('ath-1');
    expect(pushTokenSyncService.clearForUser).toHaveBeenCalledOnceWith('ath-1');
  });

  it('continues clearing independent caches when one cleanup action fails', () => {
    const matchService = jasmine.createSpyObj<MatchService>('MatchService', ['clearSessionState']);
    matchService.clearSessionState.and.throwError('storage failure');
    const notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'clear',
    ]);

    TestBed.configureTestingModule({
      providers: [
        SessionDataCleanupService,
        { provide: MatchService, useValue: matchService },
        { provide: MatchStore, useValue: jasmine.createSpyObj('MatchStore', ['clear']) },
        { provide: MvpVoteStore, useValue: jasmine.createSpyObj('MvpVoteStore', ['clear']) },
        { provide: InvitationsStore, useValue: jasmine.createSpyObj('InvitationsStore', ['clear']) },
        {
          provide: SocialFacadeService,
          useValue: jasmine.createSpyObj('SocialFacadeService', ['clearSessionState']),
        },
        { provide: NotificationService, useValue: notificationService },
        {
          provide: NotificationBadgeService,
          useValue: jasmine.createSpyObj('NotificationBadgeService', ['clear']),
        },
        {
          provide: PlayerPositionStateService,
          useValue: jasmine.createSpyObj('PlayerPositionStateService', ['clearForPlayer']),
        },
        {
          provide: PushTokenSyncService,
          useValue: jasmine.createSpyObj('PushTokenSyncService', ['clearForUser']),
        },
      ],
    });

    expect(() => TestBed.inject(SessionDataCleanupService).clear()).not.toThrow();
    expect(notificationService.clear).toHaveBeenCalledTimes(1);
  });
});
