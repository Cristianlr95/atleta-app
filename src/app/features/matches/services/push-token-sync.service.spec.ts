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
    socialApiService = jasmine.createSpyObj<SocialApiService>('SocialApiService', ['registerPushToken', 'revokePushToken']);

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
    socialApiService.revokePushToken.and.returnValue(of(void 0));
  });

  it('revokes the device token before clearing local session state', () => {
    localStorage.setItem('atleta_push_device_id:ath-1', 'device-1');
    service.clearForUser('ath-1');

    expect(socialApiService.revokePushToken).toHaveBeenCalledOnceWith('device-1');
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

  it('removes user-scoped push data when the session is cleared', async () => {
    socialApiService.registerPushToken.and.returnValue(
      of({
        id: 1,
        playerUuid: 'ath-1',
        platform: 'web',
        active: true,
      }),
    );
    await service.registerToken('push-token-123');

    service.clearForUser('ath-1');

    expect(localStorage.getItem('atleta_push_token:ath-1')).toBeNull();
    expect(localStorage.getItem('atleta_push_token_synced:ath-1')).toBeNull();
    expect(localStorage.getItem('atleta_push_device_id:ath-1')).toBeNull();
    expect(service.lastSyncedToken()).toBeNull();
    expect(service.syncError()).toBeFalse();
  });
});
