import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { SocialApiService } from 'src/app/features/social/services/social-api.service';
import { InvitationsStore } from '../stores/invitations.store';
import { NotificationBadgeService } from './notification-badge.service';
import { NotificationService } from './notification.service';

describe('NotificationBadgeService', () => {
  let service: NotificationBadgeService;
  let socialApiService: jasmine.SpyObj<SocialApiService>;
  let pendingInvitations: unknown[];
  let localPendingCount: number;

  beforeEach(() => {
    pendingInvitations = [];
    localPendingCount = 0;
    socialApiService = jasmine.createSpyObj<SocialApiService>('SocialApiService', [
      'getUnreadNotificationCount',
    ]);

    TestBed.configureTestingModule({
      providers: [
        NotificationBadgeService,
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: {
              user: {
                atletaUuid: 'ath-1',
                email: 'demo@atleta.cl',
                nombre: 'Demo',
              },
            },
          },
        },
        {
          provide: InvitationsStore,
          useValue: {
            pendingInvitations: () => pendingInvitations,
          },
        },
        {
          provide: NotificationService,
          useValue: {
            get pendingCount() {
              return localPendingCount;
            },
          },
        },
        { provide: SocialApiService, useValue: socialApiService },
      ],
    });

    service = TestBed.inject(NotificationBadgeService);
  });

  it('uses the larger value between server unread count and pending invitations to avoid double counting', async () => {
    pendingInvitations = [{ id: 'invite-1' }, { id: 'invite-2' }];
    localPendingCount = 1;
    socialApiService.getUnreadNotificationCount.and.returnValue(of({ unreadCount: 5 }));

    await service.refresh();

    expect(service.totalPending()).toBe(6);
    expect(service.refreshError()).toBeFalse();
  });

  it('falls back to pending invitations when unread count cannot be refreshed', async () => {
    pendingInvitations = [{ id: 'invite-1' }, { id: 'invite-2' }];
    socialApiService.getUnreadNotificationCount.and.returnValue(
      throwError(() => new Error('network')),
    );

    await service.refresh();

    expect(service.totalPending()).toBe(2);
    expect(service.refreshError()).toBeTrue();
  });
});
