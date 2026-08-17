import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { UserApiService } from '../../services/user-api.service';
import { PlayerSettingsPage } from './player-settings.page';

describe('PlayerSettingsPage', () => {
  let component: PlayerSettingsPage;
  let authSessionService: { currentSession: unknown };
  let userApiService: jasmine.SpyObj<UserApiService>;

  beforeEach(async () => {
    authSessionService = { currentSession: null };
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', ['changePassword']);
    userApiService.changePassword.and.returnValue(of(void 0));
    const toast = jasmine.createSpyObj<AppToastService>('AppToastService', ['success']);
    toast.success.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [PlayerSettingsPage],
      providers: [
        provideAppConfigMock(),
        ...provideHttpTesting(),
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: UserApiService, useValue: userApiService },
        { provide: AppToastService, useValue: toast },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<PlayerSettingsPage> = TestBed.createComponent(PlayerSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('changes password from settings and clears sensitive fields', async () => {
    authSessionService.currentSession = { user: { atletaUuid: 'ath-1' } };
    component.currentPassword = 'old-pass-123';
    component.newPassword = 'new-pass-123';
    component.confirmNewPassword = 'new-pass-123';

    await component.onChangePassword();

    expect(userApiService.changePassword).toHaveBeenCalledOnceWith('ath-1', {
      currentPassword: 'old-pass-123',
      newPassword: 'new-pass-123',
    });
    expect(component.currentPassword).toBe('');
    expect(component.passwordChangeMessage).toBe('Contrasena actualizada correctamente.');
  });

  it('validates confirmation before calling the API', async () => {
    authSessionService.currentSession = { user: { atletaUuid: 'ath-1' } };
    component.currentPassword = 'old-pass-123';
    component.newPassword = 'new-pass-123';
    component.confirmNewPassword = 'different-pass';

    await component.onChangePassword();

    expect(userApiService.changePassword).not.toHaveBeenCalled();
    expect(component.passwordChangeError).toBe('La confirmacion no coincide con la nueva contrasena.');
  });
});
