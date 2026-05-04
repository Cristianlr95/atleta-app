import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { SocialApiService } from 'src/app/features/social/services/social-api.service';
import { PushTokenSyncService } from './push-token-sync.service';

describe('PushTokenSyncService', () => {
  let service: PushTokenSyncService;
  let socialApiService: jasmine.SpyObj<SocialApiService>;

  beforeEach(() => {
    localStorage.clear();
    socialApiService = jasmine.createSpyObj<SocialApiService>('SocialApiService', ['registerPushToken']);

    TestBed.configureTestingModule({
      providers: [
        PushTokenSyncService,
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
            session$: NEVER,
          },
        },
        { provide: SocialApiService, useValue: socialApiService },
      ],
    });

    service = TestBed.inject(PushTokenSyncService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('registers a token with platform and stable device id', async () => {
    socialApiService.registerPushToken.and.returnValue(
      of({
        id: 1,
        playerUuid: 'ath-1',
        platform: 'web',
        active: true,
      }),
    );

    await service.registerToken(' push-token-123 ');

    expect(socialApiService.registerPushToken).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        token: 'push-token-123',
        platform: jasmine.any(String),
        deviceId: jasmine.stringMatching(/^web-/),
      }),
    );
    expect(service.lastSyncedToken()).toBe('push-token-123');
    expect(service.syncError()).toBeFalse();
  });

  it('does not call backend again when the same user token is already synced', async () => {
    socialApiService.registerPushToken.and.returnValue(
      of({
        id: 1,
        playerUuid: 'ath-1',
        platform: 'web',
        active: true,
      }),
    );

    await service.registerToken('push-token-123');
    await service.registerToken('push-token-123');

    expect(socialApiService.registerPushToken).toHaveBeenCalledTimes(1);
  });

  it('keeps token unsynced when backend registration fails', async () => {
    socialApiService.registerPushToken.and.returnValue(
      throwError(() => new Error('network')),
    );

    await expectAsync(service.registerToken('push-token-123')).toBeRejected();

    expect(service.syncError()).toBeTrue();
    expect(service.lastSyncedToken()).toBeNull();
  });
});
