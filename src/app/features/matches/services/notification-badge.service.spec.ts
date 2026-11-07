import { TestBed } from '@angular/core/testing';
import { InvitationsStore } from '../stores/invitations.store';
import { NotificationBadgeService } from './notification-badge.service';

describe('NotificationBadgeService', () => {
  let service: NotificationBadgeService;
  let pendingInvitations: unknown[];
  let loadPendingInvitations: jasmine.Spy;

  beforeEach(() => {
    pendingInvitations = [];
    loadPendingInvitations = jasmine.createSpy('loadPendingInvitations').and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        NotificationBadgeService,
        {
          provide: InvitationsStore,
          useValue: {
            pendingInvitations: () => pendingInvitations,
            loadPendingInvitations,
          },
        },
      ],
    });

    service = TestBed.inject(NotificationBadgeService);
  });

  it('counts only invitations that require a player decision', async () => {
    pendingInvitations = [{ id: 'invite-1' }, { id: 'invite-2' }];

    await service.refresh();

    expect(service.totalPending()).toBe(2);
  });

  it('refreshes actionable invitations and exposes load errors', async () => {
    loadPendingInvitations.and.resolveTo(false);

    await service.refresh();

    expect(loadPendingInvitations).toHaveBeenCalled();
    expect(service.refreshError()).toBeTrue();
  });

  it('clears the visible count on logout', async () => {
    pendingInvitations = [{ id: 'invite-1' }];
    await service.refresh();

    service.clear();

    expect(service.totalPending()).toBe(0);
    expect(service.refreshError()).toBeFalse();
  });
});
