import { TestBed } from '@angular/core/testing';
import { PushTokenSyncService } from './push-token-sync.service';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        {
          provide: PushTokenSyncService,
          useValue: { registerToken: jasmine.createSpy('registerToken').and.resolveTo() },
        },
      ],
    });

    service = TestBed.inject(NotificationService);
    service.clear();
  });

  it('deduplicates equal unread in-app notifications', async () => {
    await service.notifyAlmostReady(1);
    await service.notifyAlmostReady(1);

    expect(service.notifications().length).toBe(1);
    expect(service.pendingCount).toBe(1);
  });

  it('keeps the in-app queue compact', async () => {
    for (let index = 1; index <= 6; index += 1) {
      await service.notifyInvitationSent(`Jugador ${index}`);
    }

    expect(service.notifications().length).toBe(4);
    expect(service.notifications()[0].message).toContain('Jugador 6');
  });
});
